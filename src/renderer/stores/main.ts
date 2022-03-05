import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class MainStore {
    public configuration: any;

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
}
