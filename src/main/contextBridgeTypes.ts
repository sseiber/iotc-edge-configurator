import { AccountInfo } from '@azure/msal-node';
import { IMsalConfig } from './authProvider/authProvider';

export const Ipc_Log = 'ipc_log';
export const Ipc_MsalConfig = 'ipc_msalConfig';
export const Ipc_Signin = 'ipc_signin';
export const Ipc_Signout = 'ipc_signout';
export const Ipc_GetProfile = 'ipc_getProfile';

declare global {
    interface Window {
        ipcApi: {
            [Ipc_Log]: (tags: string[], message: string) => Promise<void>;
            [Ipc_MsalConfig]: (msalConfig: IMsalConfig) => Promise<void>;
            [Ipc_Signin]: () => Promise<AccountInfo>;
            [Ipc_Signout]: () => Promise<void>;
            [Ipc_GetProfile]: (msalConfig: IMsalConfig) => Promise<any>;
        };
    }
}
