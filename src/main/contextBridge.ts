declare global {
    interface Window {
        ipcApi: {
            log: (tags: string[], message: string) => Promise<void>;
            setMsalConfig: (msalConfig: IMsalConfig) => Promise<void>;
        };
    }
}

export const ipcApiLog = 'ipcApi.log';
export const ipcApiMsalConfig = 'ipcApi.msalConfig';

export enum SessionMessages {
    ShowWelcomeMessage = 'ShowWelcomeMessage',
    Login = 'Login',
    Logout = 'Logout',
    GetProfile = 'GetProfile',
    SetProfile = 'SetProfile'
}

export interface IMsalConfig {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    aadEndpointHost: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    graphScopes: string;
}
