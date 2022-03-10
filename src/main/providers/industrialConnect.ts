/* eslint-disable max-len */
import {
    app,
    BrowserWindow,
    IpcMain,
    IpcMainInvokeEvent
} from 'electron';
import * as contextBridgeTypes from '../contextBridgeTypes';
import logger from '../logger';
import { AppProvider } from './appProvider';
import { IoTCentralApiScope } from '../models/msalAuth';
import { MsalAuthProvider } from './auth/msalAuth';
import { IoTCentralBaseDomain } from '../models/iotCentral';
import {
    IApiContext,
    IIndustrialDirectMethodResponse,
    IndustrialConnectCommands,
    IEndpoint,
    IBrowseNodesRequest,
    IAdapterConfiguration,
    emptyAdapterConfig
} from '../models/industrialConnect';
import {
    requestApi,
    fileStream,
    sleep
} from '../utils';
import store, { StoreKeys } from '../store';
import {
    gzipSync,
    gunzipSync
} from 'zlib';
import { format } from 'date-fns';
import { resolve as resolvePath } from 'path';

const ModuleName = 'IndustrialConnectProvider';

export class IndustrialConnectProvider extends AppProvider {
    private authProvider: MsalAuthProvider;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow, authProvider: MsalAuthProvider) {
        super(ipcMain, authWindow);

        this.authProvider = authProvider;

        this.registerIpcEventHandlers();
    }

    public registerIpcEventHandlers(): void {
        this.ipcMain.handle(contextBridgeTypes.Ipc_TestEndpoint, async (_event: IpcMainInvokeEvent, apiContext: IApiContext, opcEndpoint: IEndpoint): Promise<IIndustrialDirectMethodResponse> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_TestEndpoint} handler`);

            let testEndpointResponse: IIndustrialDirectMethodResponse = {
                status: 500,
                message: ``,
                payload: {}
            };

            try {
                testEndpointResponse = await this.testEndpoint(opcEndpoint, apiContext);
            }
            catch (ex) {
                testEndpointResponse.message = `Error during ${contextBridgeTypes.Ipc_TestEndpoint} handler: ${ex.message}`;

                logger.log([ModuleName, 'error'], testEndpointResponse.message);
            }

            return testEndpointResponse;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_FetchNodes, async (_event: IpcMainInvokeEvent, apiContext: IApiContext, browseNodesRequest: IBrowseNodesRequest): Promise<IIndustrialDirectMethodResponse> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_FetchNodes} handler`);

            let fetchNodesResponse: IIndustrialDirectMethodResponse = {
                status: 500,
                message: ``,
                payload: {}
            };

            try {
                fetchNodesResponse = await this.fetchNodes(browseNodesRequest, apiContext);
            }
            catch (ex) {
                fetchNodesResponse.message = `Error during ${contextBridgeTypes.Ipc_FetchNodes} handler: ${ex.message}`;

                logger.log([ModuleName, 'error'], fetchNodesResponse.message);
            }

            return fetchNodesResponse;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetAdapterConfiguration, async (_event: IpcMainInvokeEvent, appId: string, deviceId: string): Promise<IAdapterConfiguration> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetAdapterConfiguration} handler`);

            let adapterConfig;

            try {
                const configCache = store.get(StoreKeys.adapterConfigCache);
                adapterConfig = configCache.find((config) => config.appId === appId && config.deviceId === deviceId);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetAdapterConfiguration} handler: ${ex.message}`);
            }

            return adapterConfig || {
                ...emptyAdapterConfig,
                appId,
                deviceId
            };
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_SetAdapterConfiguration, async (_event: IpcMainInvokeEvent, adapterConfig: IAdapterConfiguration): Promise<boolean> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetAdapterConfiguration} handler`);

            let result = true;

            try {
                const configCache = store.get(StoreKeys.adapterConfigCache);
                const cacheIndex = configCache.findIndex((config) => config.appId === adapterConfig.appId && config.deviceId === adapterConfig.deviceId);
                if (cacheIndex >= 0) {
                    configCache[cacheIndex] = adapterConfig;
                }
                else {
                    configCache.push(adapterConfig);
                }

                store.set(StoreKeys.adapterConfigCache, configCache);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_SetAdapterConfiguration} handler: ${ex.message}`);

                result = false;
            }

            return result;
        });
    }

    private async testEndpoint(opcEndpoint: IEndpoint, apiContext: IApiContext): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `testEndpoint`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {
                endpointVerified: false
            }
        };

        try {
            const requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${IndustrialConnectCommands.TestConnection}?api-version=1.1-preview`,
                {
                    opcEndpoint
                },
                10,
                10
            );

            const testEndpointResponse = await requestApi(requestConfig);

            finalResponse.status = testEndpointResponse?.payload?.responseCode || testEndpointResponse.status;

            if (testEndpointResponse.status === 201 && testEndpointResponse.payload?.responseCode === 200) {
                finalResponse.payload = {
                    endpointVerified: true
                };
            }
            else {
                finalResponse.message = `Error: status: ${testEndpointResponse.status}, payload responseCode: ${testEndpointResponse.payload?.responseCode}`;

                logger.log([ModuleName, 'error'], finalResponse.message);
            }
        }
        catch (ex) {
            finalResponse.message = `Error during testEndpoint: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        return finalResponse;
    }

    private async fetchNodes(browseNodesRequest: IBrowseNodesRequest, apiContext: IApiContext): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `fetchNodes`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            const testEndpointResponse = await this.testEndpoint(browseNodesRequest.opcEndpoint, apiContext);
            if (testEndpointResponse.status !== 200 || testEndpointResponse.payload.endpointVerified !== true) {
                finalResponse.message = `Unable to connect to the OPCUA endpoint - uri: ${browseNodesRequest.opcEndpoint.uri}`;
                logger.log([ModuleName, 'error'], finalResponse.message);

                return finalResponse;
            }

            logger.log([ModuleName, 'info'], `Starting node: ${browseNodesRequest.startNode}, depth: ${browseNodesRequest.depth}`);

            const requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${IndustrialConnectCommands.BrowseNodes}?api-version=1.1-preview`,
                browseNodesRequest
            );
            const browseNodesResponse = await requestApi(requestConfig);

            finalResponse.status = browseNodesResponse?.payload?.responseCode || browseNodesResponse.status;

            if (browseNodesResponse.status !== 201 || browseNodesResponse.payload?.responseCode !== 200 || !browseNodesResponse.payload.response?.JobId) {
                finalResponse.message = browseNodesResponse?.payload?.response?.error.message || `Unknown error in the response from BrowseNodes - status: ${browseNodesResponse.status}`;

                logger.log([ModuleName, 'error'], finalResponse.message);
            }
            else {
                const jobId = browseNodesResponse.payload.response?.JobId;
                const blobFilename = `fetchNodes-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
                const fetchedNodesFilePath = resolvePath(app.getPath('downloads'), blobFilename);

                let fetchBrowsedNodesResponse;

                const fetchedNodesFileStream = fileStream(fetchedNodesFilePath);
                fetchedNodesFileStream.create();

                try {
                    do {
                        const continuationToken: string = fetchBrowsedNodesResponse?.payload?.response?.ContinuationToken || '1';

                        logger.log([ModuleName, 'info'], `Calling fetchBrowsedNodes with JobId: ${jobId} and ContinuationToken: ${continuationToken}`);

                        fetchBrowsedNodesResponse = await this.fetchBrowsedNodes(apiContext, jobId, continuationToken);

                        logger.log([ModuleName, 'info'], `fetchBrowsedNodes returned status: ${fetchBrowsedNodesResponse.status}`);

                        if (fetchBrowsedNodesResponse.status === 200 && fetchBrowsedNodesResponse?.payload?.nodes) {
                            logger.log([ModuleName, 'info'], `fetchBrowsedNodes returned ${fetchBrowsedNodesResponse.payload.nodes.length} nodes`);

                            await fetchedNodesFileStream.writeJson(fetchBrowsedNodesResponse.payload.nodes);
                        }
                    } while (fetchBrowsedNodesResponse.status === 200 && fetchBrowsedNodesResponse?.payload?.continuationToken);
                }
                catch (ex) {
                    finalResponse.message = `Error while fetching node chunks: ${ex.message}`;

                    logger.log([ModuleName, 'error'], finalResponse.message);
                }
                finally {
                    await fetchedNodesFileStream.close();
                }

                if (fetchBrowsedNodesResponse.status === 200) {
                    // await this.uploadFetchedNodesFile(fetchedNodesFilePath, blobFilename, 'application/json');
                    logger.log([ModuleName, 'info'], `fetchNodes save completed file: ${fetchedNodesFilePath}`);
                }

                finalResponse.status = fetchBrowsedNodesResponse.status;
                finalResponse.message = fetchBrowsedNodesResponse.message;
                finalResponse.payload = {
                    fetchedNodesFilePath
                };
            }
        }
        catch (ex) {
            finalResponse.message = `Error during browseNodes: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        return finalResponse;
    }

    private async fetchBrowsedNodes(apiContext: IApiContext, jobId: string, continuationToken: string): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `fetchBrowsedNodes`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            const fetchBrowsedNodesResponse = await this.chunkRequest(
                apiContext,
                'FetchBrowsedNodes_v1',
                {
                    jobId,
                    continuationToken
                });

            Object.assign(finalResponse, fetchBrowsedNodesResponse);
        }
        catch (ex) {
            finalResponse.status = 500;
            finalResponse.message = `fetchBrowsedNodes failed: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        return finalResponse;
    }

    private async chunkRequest(apiContext: IApiContext, methodName: string, methodRequest: any): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `chunkRequest`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            const compressedRequest = gzipSync(JSON.stringify(methodRequest));

            let requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${methodName}?api-version=1.1-preview`,
                {
                    contentLength: compressedRequest.length,
                    payload: compressedRequest.toString('base64')
                }
            );
            let chunkResponse = await requestApi(requestConfig);

            finalResponse.status = chunkResponse?.payload?.responseCode || chunkResponse.status;

            if (chunkResponse.status !== 201 && chunkResponse?.payload?.responseCode !== 202 || !chunkResponse?.payload?.response?.RequestId) {
                finalResponse.message = chunkResponse.payload?.response?.error.message || `Unknown error in the chunked response from ${methodName} - status: ${chunkResponse.status}`;

                logger.log([ModuleName, 'info'], finalResponse.message);
            }
            else {
                do {
                    await sleep(1000);

                    requestConfig = await this.getDirectMethodApiConfig(
                        `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${methodName}?api-version=1.1-preview`,
                        {
                            RequestId: chunkResponse.payload.response.RequestId
                        }
                    );
                    chunkResponse = await requestApi(requestConfig);

                    logger.log([ModuleName, 'info'], `${methodName} returned status: ${chunkResponse.payload.responseCode}`);
                } while (chunkResponse.status === 201 && chunkResponse?.payload?.responseCode === 102);

                if (chunkResponse.status === 201 && chunkResponse.payload.responseCode === 200 && chunkResponse.payload?.response?.Payload?.length) {
                    const resultBuffer = gunzipSync(Buffer.from(chunkResponse.payload.response.Payload, 'base64'));

                    finalResponse.message = `${methodName} succeeded`;
                    finalResponse.payload = JSON.parse(resultBuffer.toString());
                }
                else {
                    finalResponse.message = chunkResponse.payload?.response?.error.message || `Unknown error in the chunked response from ${methodName} - status: ${chunkResponse.status}`;

                    logger.log([ModuleName, 'error'], finalResponse.message);
                }

                finalResponse.status = chunkResponse.payload.responseCode;
            }
        }
        catch (ex) {
            finalResponse.status = 500;
            finalResponse.message = `${methodName} failed: ${ex.message}`;

            logger.log([ModuleName, 'info'], finalResponse.message);
        }

        return finalResponse;
    }

    private async getDirectMethodApiConfig(url: string, request: any, connectionTimeout = 30, responseTimeout = 30): Promise<any> {
        const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);

        return {
            method: 'post',
            url,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            data: {
                connectionTimeout,
                responseTimeout,
                request
            }
        };
    }
}

