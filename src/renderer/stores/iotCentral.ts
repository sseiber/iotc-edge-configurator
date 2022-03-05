import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIotCentralApp,
    IIotCentralDevice
} from '../../main/models/iotCentral';
import {
    Endpoint
} from '../../main/models/industrialConnect';

export class IotCentralStore {
    constructor() {
        makeAutoObservable(this);
    }

    public azureResourceAccessToken = '';
    public configuration: any = {};
    public waitingOnApiCall = false;
    public iotcApps: IIotCentralApp[] = [];
    public iotcDevices: IIotCentralDevice[] = [];
    public connectionGood = false;

    public serviceError = '';

    public async openConfiguration(): Promise<void> {
        const configuration = await window.ipcApi[contextBridgeTypes.Ipc_OpenConfiguration]();
        if (configuration) {
            this.configuration = configuration;
        }
    }

    public async getIotCentralApps(): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const response = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcApps]();
            if (response) {
                runInAction(() => {
                    this.iotcApps = response;
                });
            }
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

    public async getIotCentralDevices(appSubdomain: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const response = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDevices](appSubdomain);
            if (response) {
                runInAction(() => {
                    this.iotcDevices = response;
                });
            }
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

    public async callIoTCentralDirectMethod(appSubdomain: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const response = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDevices](appSubdomain);
            if (response) {
                runInAction(() => {
                    this.iotcDevices = response;
                });
            }
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
