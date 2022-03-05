import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    Endpoint
} from '../../main/models/industrialConnect';

export class IndustrialConnectStore {
    constructor() {
        makeAutoObservable(this);
    }

    public waitingOnApiCall = false;
    public connectionGood = false;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async testIndustrialConnectEndpoint(opcEndpoint: Endpoint, appSubdomain: string, gatewayId: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const connectionGood = await window.ipcApi[contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint](opcEndpoint, appSubdomain, gatewayId);
            runInAction(() => {
                this.connectionGood = connectionGood;
            });
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An error occurred while attempting to get the list of IoT Central apps: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingOnApiCall = false;
            });
        }
    }
}
