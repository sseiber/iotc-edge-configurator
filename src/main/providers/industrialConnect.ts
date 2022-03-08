/* eslint-disable max-len */
import {
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
    IndustrialConnectCommands,
    IEndpoint,
    IBrowseNodesRequest,
    IAdapterConfiguration
} from '../models/industrialConnect';
import { requestApi } from '../utils';
import store, { StoreKeys } from '../store';

const ModuleName = 'IndustrialConnectProvider';

export class IndustrialConnectProvider extends AppProvider {
    private authProvider: MsalAuthProvider;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow, authProvider: MsalAuthProvider) {
        super(ipcMain, authWindow);

        this.authProvider = authProvider;

        this.registerIpcEventHandlers();
    }

    public registerIpcEventHandlers(): void {
        this.ipcMain.handle(contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint, async (_event: IpcMainInvokeEvent, opcEndpoint: IEndpoint, appSubdomain: string, deviceId: string, moduleName: string): Promise<boolean> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint} handler`);

            let connectionGood;

            try {
                connectionGood = await this.testIndustrialConnectEndpoint(opcEndpoint, appSubdomain, deviceId, moduleName);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint} handler: ${ex.message}`);
            }

            return connectionGood;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_BrowseNodes, async (_event: IpcMainInvokeEvent, browseNodesRequest: IBrowseNodesRequest, appSubdomain: string, deviceId: string, moduleName: string): Promise<string> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_BrowseNodes} handler`);

            let browseNodesResponseFilePath;

            try {
                browseNodesResponseFilePath = await this.browseNodes(browseNodesRequest, appSubdomain, deviceId, moduleName);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_BrowseNodes} handler: ${ex.message}`);
            }

            return browseNodesResponseFilePath;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_OpenAdapterConfiguration, async (_event: IpcMainInvokeEvent): Promise<IAdapterConfiguration[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenAdapterConfiguration} handler`);

            let adapterConfig;

            try {
                adapterConfig = store.get(StoreKeys.adapterConfigCache);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_OpenAdapterConfiguration} handler: ${ex.message}`);
            }

            return adapterConfig;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_SaveAdapterConfiguration, async (_event: IpcMainInvokeEvent): Promise<boolean> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SaveAdapterConfiguration} handler`);

            let result;

            try {
                // const adapterConfigs = store.get(StoreKeys.adapterConfigCache);
                // const index = adapterConfigs.indexOf('');
                // if (index !== -1) {
                //     return true;
                // }

                result = true;
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_SaveAdapterConfiguration} handler: ${ex.message}`);
            }

            return result;
        });
    }

    private async testIndustrialConnectEndpoint(opcEndpoint: IEndpoint, appSubdomain: string, deviceId: string, moduleName: string): Promise<boolean> {
        logger.log([ModuleName, 'info'], `testIndustrialConnectEndpoint`);

        let connectionGood = false;

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'post',
                // eslint-disable-next-line max-len
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/modules/${moduleName}/commands/${IndustrialConnectCommands.TestConnection}?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                data: {
                    connectionTimeout: 10,
                    responseTimeout: 10,
                    request: {
                        opcEndpoint
                    }
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 201 && response.payload?.responseCode === 200) {
                connectionGood = true;
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}, payload responseCode: ${response.payload?.responseCode}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during testIndustrialConnectEndpoint: ${ex.message}`);
        }

        return connectionGood;
    }

    private async browseNodes(browseNodesRequest: IBrowseNodesRequest, appSubdomain: string, deviceId: string, moduleName: string): Promise<string> {
        logger.log([ModuleName, 'info'], `browseNodes`);

        let browseNodesResponseFilePath;

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'post',
                // eslint-disable-next-line max-len
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/modules/${moduleName}/commands/${IndustrialConnectCommands.BrowseNodes}?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                data: {
                    connectionTimeout: 30,
                    responseTimeout: 30,
                    request: {
                        browseNodesRequest
                    }
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 201 && response.payload?.responseCode === 200) {
                const browseNodesResponse = response.payload.JobId;
                browseNodesResponseFilePath = browseNodesResponse;
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}, payload responseCode: ${response.payload?.responseCode}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during browseNodes: ${ex.message}`);
        }

        return browseNodesResponseFilePath;
    }
}
