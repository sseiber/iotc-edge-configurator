import { makeAutoObservable, runInAction } from 'mobx';
import {
    Ipc_OpenConfiguration,
    Ipc_GetIotcApps,
    IIotCentralApp
} from '../../main/contextBridgeTypes';

// @ts-ignore
const genericError = `Sorry, an unknown error occurred, try again after rebooting your device`;

export class IotCentralStore {
    constructor() {
        makeAutoObservable(this);
    }

    public azureResourceAccessToken = '';
    public configuration: any = {};
    public iotcApps: IIotCentralApp[] = [];

    public serviceError = '';

    public async openConfiguration(): Promise<void> {
        const configuration = await window.ipcApi[Ipc_OpenConfiguration]();
        if (configuration) {
            this.configuration = configuration;
        }
    }

    public async getIotCentralApps(): Promise<void> {
        try {
            const response = await window.ipcApi[Ipc_GetIotcApps]();
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
    }
}
