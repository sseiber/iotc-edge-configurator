import { makeAutoObservable, runInAction } from 'mobx';
import { getUserSession } from '../apis/session';
import { IMsalConfig } from '../../main/contextBridge';

export class SessionStore {
    constructor() {
        makeAutoObservable(this);
    }

    // AAD app registration credentials
    public clientId = '4072cff6-8d4f-49e8-ac6c-fead2b684971';
    public tenantId = '72f988bf-86f1-41af-91ab-2d7cd011db47';

    // MSAL auth configuration
    public redirectUri = 'msal://redirect';

    // AAD endpoints
    public aadEndpointHost = 'https://login.microsoftonline.com/';
    public graphEndpointHost = 'https://graph.microsoft.com/';

    // Graph resources
    public graphMeEndpoint = 'v1.0/me';

    // Graph scopes
    public graphScopes = 'User.Read';

    public userId = '';
    public displayName = '';
    public email = '';
    public authProvider = '';
    public redirectPath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async setMsalConfig(msalConfig: IMsalConfig): Promise<void> {
        return window.ipcApi.setMsalConfig(msalConfig);
    }

    public async getUserSessionInfo(_userId: string): Promise<void> {
        try {
            const response = await getUserSession();
            const responsePayload = response.payload;

            if (responsePayload && responsePayload.status === 200) {
                runInAction(() => {
                    // this.authenticationState = AuthenticationState.Authenticated;
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

            // this.authenticationState = AuthenticationState.CouldNotAuthenticate;
        }
        catch (ex) {
            runInAction(() => {
                // this.authenticationState = AuthenticationState.CouldNotAuthenticate;
                this.userId = '';
                this.displayName = '';
                this.email = '';
                this.authProvider = '';

                this.serviceError = `An error occurred while attempting to get the currenet user session: ${ex.message}`;
            });
        }
    }
}
