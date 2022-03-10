import { makeAutoObservable, runInAction, toJS } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IApiContext,
    IEndpoint,
    IBrowseNodesRequest
} from '../../main/models/industrialConnect';

export class IndustrialConnectStore {
    constructor() {
        makeAutoObservable(this);
    }

    public waitingOnEndpointVerification = false;
    public waitingOnFetchNodes = false;
    public endpointVerified = false;
    public browsedNodesResultFilePath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async testEndpoint(apiContext: IApiContext, opcEndpoint: IEndpoint): Promise<void> {
        runInAction(() => {
            this.waitingOnEndpointVerification = true;
        });

        try {
            const testEndpointResponse = await window.ipcApi[contextBridgeTypes.Ipc_TestEndpoint](apiContext, opcEndpoint);

            runInAction(() => {
                this.endpointVerified = testEndpointResponse.status === 200 && testEndpointResponse.payload.endpointVerified === true;
            });
        }
        catch (ex) {
            runInAction(() => {
                this.endpointVerified = false;

                this.serviceError = `An error occurred while testing the connection to the OPCUA server: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingOnEndpointVerification = false;
            });
        }
    }

    public async fetchNodes(apiContext: IApiContext, browseNodesRequest: IBrowseNodesRequest): Promise<void> {
        runInAction(() => {
            this.waitingOnFetchNodes = true;
        });

        try {
            const fetchNodesResponse = await window.ipcApi[contextBridgeTypes.Ipc_FetchNodes](apiContext, {
                ...browseNodesRequest,
                requestedNodeClasses: toJS(browseNodesRequest.requestedNodeClasses),
                requestedAttributes: toJS(browseNodesRequest.requestedAttributes)
            });

            runInAction(() => {
                this.browsedNodesResultFilePath = fetchNodesResponse.status === 200 ? fetchNodesResponse.payload.fetchedNodesFilePath : '';
            });
        }
        catch (ex) {
            runInAction(() => {
                this.browsedNodesResultFilePath = '';

                this.serviceError = `An error occurred while attempting to browse the node heirarchy on the OPCUA server: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingOnFetchNodes = false;
            });
        }
    }
}