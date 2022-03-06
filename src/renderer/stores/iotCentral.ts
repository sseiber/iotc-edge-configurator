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
    public mapApps: Map<string, IIotCentralApp> = new Map<string, IIotCentralApp>();
    public mapAppDevices: Map<string, IIotCentralDevice[]> = new Map<string, IIotCentralDevice[]>();
    public mapDeviceApp: Map<string, IIotCentralApp> = new Map<string, IIotCentralApp>();
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
            if (!refresh && this.mapApps.size > 0) {
                return;
            }

            const apps = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcApps]();
            if (apps) {
                runInAction(() => {
                    this.mapApps.clear();
                    this.mapAppDevices.clear();
                    this.mapDeviceApp.clear();
                    this.mapDeviceModules.clear();

                    for (const app of apps) {
                        this.mapApps.set(app.applicationId, app);
                    }
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

    public async getIotCentralDevices(appId: string, refresh: boolean): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            if (!refresh && this.mapAppDevices.get(appId)?.length) {
                return;
            }

            const appSubdomain = this.mapApps.get(appId).subdomain;
            const devices = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDevices](appSubdomain, appId);
            if (devices) {
                runInAction(() => {
                    this.mapAppDevices.clear();
                    this.mapDeviceApp.clear();
                    this.mapDeviceModules.clear();

                    this.mapAppDevices.set(appId, devices);

                    for (const device of devices) {
                        this.mapDeviceApp.set(device.id, this.mapApps.get(appId));
                    }
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

    public async getDeviceModules(deviceId: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            if (this.mapDeviceModules.size > 0) {
                return;
            }

            const appSubdomain = this.mapDeviceApp.get(deviceId).subdomain;
            const modules = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDeviceModules](appSubdomain, deviceId);
            if (modules) {
                runInAction(() => {
                    this.mapDeviceModules.clear();

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

    public async testIndustrialConnectEndpoint(opcEndpoint: Endpoint, appSubdomain: string, deviceId: string): Promise<void> {
        runInAction(() => {
            this.waitingOnApiCall = true;
        });

        try {
            const moduleName = this.mapDeviceModules.get(deviceId)[0].name;
            const connectionGood = await window.ipcApi[contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint](opcEndpoint, appSubdomain, deviceId, moduleName);
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
