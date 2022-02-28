import { makeAutoObservable, runInAction } from 'mobx';
import {
    Ipc_OpenConfiguration,
    Ipc_RequestApi
} from '../../main/contextBridgeTypes';
import qs from 'qs';

// @ts-ignore
const genericError = `Sorry, an unknown error occurred, try again after rebooting your device`;

export interface IIotCentralApp {
    name: string;
    id: string;
    location: string;
    properties: {
        applicationId: string;
        displayName: string;
        subdomain: string;
    };
}

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

    public async requestAzureResourceAccessToken(): Promise<void> {
        try {
            const data = qs.stringify({
                grant_type: 'client_credentials',
                client_id: this.configuration.azureAppRegistration.clientId,
                client_secret: this.configuration.azureAppRegistration.clientSecret,
                resource: this.configuration.azureAppRegistration.managementEndpoint
            });

            const config = {
                method: 'post',
                url: 'https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/oauth2/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data
            };

            const response = await window.ipcApi[Ipc_RequestApi](config);
            if (response) {
                runInAction(() => {
                    this.azureResourceAccessToken = response.payload.access_token;
                });
            }
            else {
                this.serviceError = `An unknown error occurred during the request`;
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An unknown error occurred during the request: ${ex.message}`;
            });
        }
    }

    public async getIotCentralApps(): Promise<void> {
        try {
            await this.requestAzureResourceAccessToken();

            const config = {
                method: 'get',
                url: `https://management.azure.com/subscriptions/d27548b8-5826-4dc5-a1b4-82f9b187b075/providers/Microsoft.IoTCentral/iotApps?api-version=2021-06-01`,
                headers: {
                    Authorization: `Bearer ${this.azureResourceAccessToken}`
                }
            };

            const response = await window.ipcApi[Ipc_RequestApi](config);
            if (response) {
                runInAction(() => {
                    this.iotcApps = response?.payload?.value || [];
                });
            }
            else {
                this.serviceError = `An unknown error occurred during the request`;
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An unknown error occurred during the request: ${ex.message}`;
            });
        }
    }
}
