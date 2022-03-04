import { makeAutoObservable, runInAction } from 'mobx';
import {
    Ipc_GetLastOAuthError,
    Ipc_SetLastOAuthError,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    IMsalConfig,
    AppNavigationPaths
} from '../../main/contextBridgeTypes';
import { AccountInfo } from '@azure/msal-node';
// import store, { StoreKeys } from '../../main/store';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class SessionStore {
    constructor() {
        makeAutoObservable(this);
    }

    public authenticationState: AuthenticationState = AuthenticationState.Unauthenticated;

    public username = '';
    public displayName = '';
    public email = '';
    public redirectPath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public getLastOAuthError(): Promise<string> {
        return window.ipcApi[Ipc_GetLastOAuthError]();
    }

    public setLastOAuthError(message: string): Promise<void> {
        return window.ipcApi[Ipc_SetLastOAuthError](message);
    }

    public async openConfiguration(): Promise<any> {
        return window.ipcApi[Ipc_GetMsalConfig]();
    }

    public async setMsalConfig(msalConfig: IMsalConfig): Promise<void> {
        return window.ipcApi[Ipc_SetMsalConfig](msalConfig);
    }

    public async getMsalConfig(): Promise<IMsalConfig> {
        return window.ipcApi[Ipc_GetMsalConfig]();
    }

    public async signin(redirectPath = AppNavigationPaths.Root): Promise<void> {
        runInAction(() => {
            this.authenticationState = AuthenticationState.Authenticating;
        });

        try {
            const account: AccountInfo = await window.ipcApi[Ipc_Signin](redirectPath);
            if (account) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.username = account.username;
                    this.displayName = account.name || 'Unknown';
                });
            }
            else {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;

                this.serviceError = `An error occurred while attempting to access the currenet user account`;
            }
        }
        catch (ex) {
            runInAction(() => {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;
            });
        }
    }

    public async signout(): Promise<void> {
        try {
            await window.ipcApi[Ipc_Signout]();
            runInAction(() => {
                this.username = '';
                this.displayName = '';
            });
        }
        finally {
            this.authenticationState = AuthenticationState.Unauthenticated;
        }
    }

    public async getUserProfile(): Promise<void> {
        runInAction(() => {
            this.authenticationState = AuthenticationState.Authenticating;
        });

        try {
            const response: any = await window.ipcApi[Ipc_Signin]('');
            if (response?.status === undefined) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.username = response.data.userId;
                    this.displayName = response.data.displayName;
                });
            }
            else {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.CouldNotAuthenticate;
                });
            }
        }
        catch (ex) {
            runInAction(() => {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;
            });
        }
    }

    public async getUserSessionInfo(_userId: string): Promise<void> {
        try {
            const account = await window.ipcApi[Ipc_GetAccount]();
            if (account) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.username = account.username;
                    this.displayName = account?.name || 'Unknown';
                });
            }
            else {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;

                this.serviceError = `An error occurred while attempting to access the currenet user account`;
            }
        }
        catch (ex) {
            runInAction(() => {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;
                this.username = '';
                this.displayName = '';

                this.serviceError = `An error occurred while attempting to access the currenet user account: ${ex.message}`;
            });
        }
    }
}
