import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    SecurityMode,
    EndpointCredentialType,
    OpcNodeClass,
    OpcAttribute,
    IDeviceConfiguration
} from '../../main/models/industrialConnect';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class MainStore {
    public configuration: any;
    public deviceConfigMap: Map<string, IDeviceConfiguration> = new Map<string, IDeviceConfiguration>();

    constructor() {
        makeAutoObservable(this);
    }

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async openConfiguration(): Promise<void> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_OpenConfiguration]();
        if (response) {
            runInAction(() => {
                this.configuration = response;
            });
        }
    }

    public async openAdapterConfiguration(): Promise<void> {
        const configCache = await window.ipcApi[contextBridgeTypes.Ipc_OpenAdapterConfiguration]();
        if (configCache) {
            runInAction(() => {
                for (const config of configCache) {
                    this.deviceConfigMap.set(`${config.appId}-${config.deviceId}`, config.deviceConfig);
                }
            });
        }
    }

    public getCachedDeviceConfiguration(appId: string, deviceId: string): IDeviceConfiguration {
        return this.deviceConfigMap.get(`${appId}-${deviceId}`) || {
            testConnection: {
                opcEndpointUri: '',
                securityMode: SecurityMode.Lowest,
                credentials: {
                    CredentialType: EndpointCredentialType.Anonymous,
                    Username: '',
                    Password: ''
                }
            },
            browseNodes: {
                startNode: '',
                depth: 1,
                requestedNodeClasses: [OpcNodeClass.Object, OpcNodeClass.Variable],
                requestedAttributes: [OpcAttribute.DisplayName, OpcAttribute.BrowseName]
            }
        };
    }

    public setCachedDeviceConfiguration(_appId: string, _deviceId: string): void {
        // var index = items.indexOf(3452);

        // if (~index) {
        //     items[index] = 1010;
        // }

        return;
    }
}
