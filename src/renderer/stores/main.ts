import { makeAutoObservable, runInAction, toJS } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    emptyAdapterConfig
} from '../../main/models/industrialConnect';
import _set from 'lodash.set';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class MainStore {
    constructor() {
        makeAutoObservable(this);
    }

    public configuration: any;
    public adapterConfig = emptyAdapterConfig;

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

    public updateAdapterConfig(key: string, value: any): void {
        runInAction(() => {
            _set(this.adapterConfig, key, value);
        });
    }

    public async loadAdapterConfiguration(appId: string, deviceId: string): Promise<void> {
        const adapterConfig = await window.ipcApi[contextBridgeTypes.Ipc_GetAdapterConfiguration](appId, deviceId);
        if (adapterConfig) {
            runInAction(() => {
                this.adapterConfig = adapterConfig;
            });
        }
    }

    public async saveAdapterConfig(): Promise<void> {
        await window.ipcApi[contextBridgeTypes.Ipc_SetAdapterConfiguration](toJS(this.adapterConfig));
    }
}
