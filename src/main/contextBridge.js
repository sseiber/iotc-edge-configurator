/* eslint-disable @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer } = require('electron');
const {
    Ipc_Log,
    Ipc_MsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile
} = require('./contextBridgeTypes.ts');

contextBridge.exposeInMainWorld('ipcApi', {
    [Ipc_Log]: (tags, message) => ipcRenderer.invoke(Ipc_Log, tags, message),
    [Ipc_MsalConfig]: (msalConfig) => ipcRenderer.invoke(Ipc_MsalConfig, msalConfig),
    [Ipc_Signin]: () => ipcRenderer.invoke(Ipc_Signin),
    [Ipc_Signout]: () => ipcRenderer.invoke(Ipc_Signout),
    [Ipc_GetAccount]: () => ipcRenderer.invoke(Ipc_GetAccount),
    [Ipc_GetProfile]: () => ipcRenderer.invoke(Ipc_GetProfile)
});
