import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../../main/models/iotCentral';
import {
    Endpoint
} from '../../main/models/industrialConnect';

export class IotCentralStore {
    constructor() {
        makeAutoObservable(this);
    }

    public waitingOnApiCall = false;
    public apps: IIotCentralApp[] = [];
    public mapAppDevices: Map<string, IIotCentralDevice[]> = new Map<string, IIotCentralDevice[]>();
    public mapDeviceModules: Map<string, IIotCentralModule[]> = new Map<string, IIotCentralModule[]>();
    public connectionGood = false;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async getIotCentralApps(refresh: boolean): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            if (!refresh && this.apps?.length) {
                return;
            }

            const apps = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcApps]();
            if (apps) {
                runInAction(() => {
                    this.apps = apps;
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

    public async getIotCentralDevices(appId: string, appSubdomain: string, refresh: boolean): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            if (!refresh && this.mapAppDevices.get(appId)?.length) {
                return;
            }

            const devices = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDevices](appSubdomain);
            if (devices) {
                runInAction(() => {
                    this.mapAppDevices.set(appId, devices);
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

    public async getDeviceModules(appSubdomain: string, deviceId: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const modules = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDeviceModules](appSubdomain, deviceId);
            if (modules) {
                runInAction(() => {
                    this.mapDeviceModules.set(deviceId, modules);
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
}
