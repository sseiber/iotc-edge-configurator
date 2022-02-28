import { AccountInfo } from '@azure/msal-node';

export const Ipc_Log = 'ipc_log';
export const Ipc_OpenConfiguration = 'ipc_openConfiguration';
export const Ipc_SetMsalConfig = 'ipc_setMsalConfig';
export const Ipc_GetMsalConfig = 'ipc_getMsalConfig';
export const Ipc_Signin = 'ipc_signin';
export const Ipc_Signout = 'ipc_signout';
export const Ipc_GetAccount = 'Ipc_GetAccount';
export const Ipc_GetProfile = 'ipc_getProfile';
export const Ipc_RequestApi = 'ipc_requestApi';
export const Ipc_GetIotcApps = 'ipc_getIotcApps';
export const Ipc_OpenLink = 'ipc_openLink';

export interface IMsalConfig {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadEndpointHost: string;
    appProtocolName: string;
}

export interface IIotCentralApp {
    name: string;
    id: string;
    location: string;
    applicationId: string;
    displayName: string;
    subdomain: string;
}

declare global {
    interface Window {
        ipcApi: {
            [Ipc_Log]: (tags: string[], message: string) => Promise<void>;
            [Ipc_OpenConfiguration]: () => Promise<any>;
            [Ipc_SetMsalConfig]: (msalConfig: IMsalConfig) => Promise<void>;
            [Ipc_GetMsalConfig]: () => Promise<IMsalConfig>;
            [Ipc_Signin]: (redirectPath: string) => Promise<AccountInfo>;
            [Ipc_Signout]: () => Promise<void>;
            [Ipc_GetAccount]: () => Promise<AccountInfo>;
            [Ipc_GetProfile]: (msalConfig: IMsalConfig) => Promise<any>;
            [Ipc_RequestApi]: (config: any) => Promise<any>;
            [Ipc_GetIotcApps]: () => Promise<IIotCentralApp[]>;
            [Ipc_OpenLink]: (url: string) => Promise<void>;
        };
    }
}
