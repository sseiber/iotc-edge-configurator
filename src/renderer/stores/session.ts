import { makeAutoObservable, runInAction } from 'mobx';
import { getUserSession } from '../apis/session';
import {
    Ipc_Signin,
    Ipc_MsalConfig
} from '../../main/contextBridgeTypes';

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

    public authenticationState: AuthenticationState;

    // AAD app registration credentials
    public clientId = '4072cff6-8d4f-49e8-ac6c-fead2b684971';
    public tenantId = '72f988bf-86f1-41af-91ab-2d7cd011db47';

    // MSAL auth configuration
    public redirectUri = 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971://auth';

    // AAD endpoints
    public aadEndpointHost = 'https://login.microsoftonline.com/';
    public graphEndpointHost = 'https://graph.microsoft.com/';

    // Graph resources
    public graphMeEndpoint = 'v1.0/me';

    public tokenCachePath = '.webpack/data';
    public tokenCacheName = 'cache.json';
    public appProtocolName = 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971';

    public userId = '';
    public displayName = '';
    public email = '';
    public authProvider = '';
    public redirectPath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async setMsalConfig(): Promise<void> {
        return window.ipcApi[Ipc_MsalConfig]({
            clientId: this.clientId,
            tenantId: this.tenantId,
            redirectUri: this.redirectUri,
            aadEndpointHost: this.aadEndpointHost,
            graphEndpointHost: this.graphEndpointHost,
            graphMeEndpoint: this.graphMeEndpoint,
            tokenCachePath: this.tokenCachePath,
            tokenCacheName: this.tokenCacheName,
            appProtocolName: this.appProtocolName
        });
    }

    public async signin(): Promise<void> {
        runInAction(() => {
            this.authenticationState = AuthenticationState.Authenticating;
        });

        try {
            const response: any = await window.ipcApi[Ipc_Signin]();
            if (response?.status === undefined) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.userId = response.data.userId;
                    this.displayName = response.data.displayName;
                    this.email = response.data.email;
                    this.authProvider = response.data.authProvider;
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

    public async getUserProfile(): Promise<void> {
        runInAction(() => {
            this.authenticationState = AuthenticationState.Authenticating;
        });

        try {
            const response: any = await window.ipcApi[Ipc_Signin]();
            if (response?.status === undefined) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.userId = response.data.userId;
                    this.displayName = response.data.displayName;
                    this.email = response.data.email;
                    this.authProvider = response.data.authProvider;
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
            const response = await getUserSession();
            const responsePayload = response.payload;

            if (responsePayload && responsePayload.status === 200) {
                runInAction(() => {
                    this.authenticationState = AuthenticationState.Authenticated;
                    this.userId = response.payload.userId;
                    this.displayName = response.payload.displayName;
                    this.email = response.payload.email;
                    this.authProvider = response.payload.authProvider;
                });
            }
            else {
                runInAction(() => {
                    this.serviceError = responsePayload.statusMessage || response.message;
                });
            }

            this.authenticationState = AuthenticationState.CouldNotAuthenticate;
        }
        catch (ex) {
            runInAction(() => {
                this.authenticationState = AuthenticationState.CouldNotAuthenticate;
                this.userId = '';
                this.displayName = '';
                this.email = '';
                this.authProvider = '';

                this.serviceError = `An error occurred while attempting to get the currenet user session: ${ex.message}`;
            });
        }
    }
}
