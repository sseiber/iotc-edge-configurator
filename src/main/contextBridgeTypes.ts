import { AccountInfo } from '@azure/msal-node';
import { IMsalConfig } from '../main/authProvider/authProvider';
import {
    IIotCentralApp,
    IIotCentralDevice
} from '../main/models/iotCentral';
import {
    Endpoint
} from '../main/models/industrialConnect';

// Main
const Ipc_Log = 'ipc_log';
const Ipc_OpenConfiguration = 'ipc_openConfiguration';
const Ipc_OpenLink = 'ipc_openLink';

// Auth
const Ipc_GetLastOAuthError = 'ipc_getLastOAuthError';
const Ipc_SetLastOAuthError = 'ipc_setLastOAuthError';
const Ipc_SetMsalConfig = 'ipc_setMsalConfig';
const Ipc_GetMsalConfig = 'ipc_getMsalConfig';
const Ipc_Signin = 'ipc_signin';
const Ipc_Signout = 'ipc_signout';
const Ipc_GetAccount = 'Ipc_GetAccount';
const Ipc_GetProfile = 'ipc_getProfile';

// IoT Central
const Ipc_RequestApi = 'ipc_requestApi';
const Ipc_GetIotcApps = 'ipc_getIotcApps';
const Ipc_GetIotcDevices = 'ipc_getIotcDevices';
const Ipc_TestIndustrialConnectEndpoint = 'ipc_testIndustrialConnectEndpoint';

declare global {
    interface Window {
        ipcApi: {
            // Main
            [Ipc_Log]: (tags: string[], message: string) => Promise<void>;
            [Ipc_OpenConfiguration]: () => Promise<any>;
            [Ipc_OpenLink]: (url: string) => Promise<void>;

            // Auth
            [Ipc_GetLastOAuthError]: () => Promise<string>;
            [Ipc_SetLastOAuthError]: (message: string) => Promise<void>;
            [Ipc_SetMsalConfig]: (msalConfig: IMsalConfig) => Promise<void>;
            [Ipc_GetMsalConfig]: () => Promise<IMsalConfig>;
            [Ipc_Signin]: (redirectPath: string) => Promise<AccountInfo>;
            [Ipc_Signout]: () => Promise<void>;
            [Ipc_GetAccount]: () => Promise<AccountInfo>;
            [Ipc_GetProfile]: (msalConfig: IMsalConfig) => Promise<any>;

            // IoT Central
            [Ipc_RequestApi]: (config: any) => Promise<any>;
            [Ipc_GetIotcApps]: () => Promise<IIotCentralApp[]>;
            [Ipc_GetIotcDevices]: (appSubDomain: string) => Promise<IIotCentralDevice[]>;
            [Ipc_TestIndustrialConnectEndpoint]: (opcEndpoint: Endpoint, appSubdomain: string, gatewayId: string) => Promise<boolean>;
        };
    }
}

export {
    Ipc_Log,
    Ipc_OpenConfiguration,
    Ipc_OpenLink,
    Ipc_GetLastOAuthError,
    Ipc_SetLastOAuthError,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    Ipc_GetIotcApps,
    Ipc_GetIotcDevices,
    Ipc_TestIndustrialConnectEndpoint
};
