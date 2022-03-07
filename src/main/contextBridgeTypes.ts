import { AccountInfo } from '@azure/msal-node';
import { IMsalConfig } from '../main/models/msalAuth';
import {
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../main/models/iotCentral';
import {
    IEndpoint,
    IBrowseNodesRequest
} from '../main/models/industrialConnect';

// Main
const Ipc_Log = 'Ipc_Log';
const Ipc_OpenConfiguration = 'Ipc_OpenConfiguration';
const Ipc_OpenLink = 'Ipc_OpenLink';

// Auth
const Ipc_GetLastOAuthError = 'Ipc_GetLastOAuthError';
const Ipc_SetLastOAuthError = 'Ipc_SetLastOAuthError';
const Ipc_SetMsalConfig = 'Ipc_SetMsalConfig';
const Ipc_GetMsalConfig = 'Ipc_GetMsalConfig';
const Ipc_Signin = 'Ipc_Signin';
const Ipc_Signout = 'Ipc_Signout';
const Ipc_GetAccount = 'Ipc_GetAccount';
const Ipc_GetProfile = 'Ipc_GetProfile';

// IoT Central
const Ipc_RequestApi = 'Ipc_RequestApi';
const Ipc_GetIotcApps = 'Ipc_GetIotcApps';
const Ipc_GetIotcDevices = 'Ipc_GetIotcDevices';
const Ipc_GetIotcDeviceModules = 'Ipc_GetIotcDeviceModules';

// Industrial Connect
const Ipc_TestIndustrialConnectEndpoint = 'Ipc_TestIndustrialConnectEndpoint';
const Ipc_BrowseNodes = 'Ipc_BrowseNodes';

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
            [Ipc_GetIotcDevices]: (appSubDomain: string, appId: string) => Promise<IIotCentralDevice[]>;
            [Ipc_GetIotcDeviceModules]: (appSubdomain: string, deviceId: string) => Promise<IIotCentralModule[]>;

            // Industrial Connect
            [Ipc_TestIndustrialConnectEndpoint]: (opcEndpoint: IEndpoint, appSubdomain: string, deviceId: string, moduleName: string) => Promise<boolean>;
            [Ipc_BrowseNodes]: (browseNodesRequest: IBrowseNodesRequest, appSubdomain: string, deviceId: string, moduleName: string) => Promise<string>;
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
    Ipc_GetIotcDeviceModules,
    Ipc_TestIndustrialConnectEndpoint,
    Ipc_BrowseNodes
};
