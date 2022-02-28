/* eslint-disable @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer } = require('electron');
const {
    Ipc_Log,
    Ipc_OpenConfiguration,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    Ipc_OpenLink
} = require('./contextBridgeTypes.ts');

contextBridge.exposeInMainWorld('ipcApi', {
    [Ipc_Log]: (tags, message) => ipcRenderer.invoke(Ipc_Log, tags, message),
    [Ipc_OpenConfiguration]: () => ipcRenderer.invoke(Ipc_OpenConfiguration),
    [Ipc_SetMsalConfig]: (msalConfig) => ipcRenderer.invoke(Ipc_SetMsalConfig, msalConfig),
    [Ipc_GetMsalConfig]: () => ipcRenderer.invoke(Ipc_GetMsalConfig),
    [Ipc_Signin]: (redirectPath) => ipcRenderer.invoke(Ipc_Signin, redirectPath),
    [Ipc_Signout]: () => ipcRenderer.invoke(Ipc_Signout),
    [Ipc_GetAccount]: () => ipcRenderer.invoke(Ipc_GetAccount),
    [Ipc_GetProfile]: () => ipcRenderer.invoke(Ipc_GetProfile),
    [Ipc_RequestApi]: (config) => ipcRenderer.invoke(Ipc_RequestApi, config),
    [Ipc_OpenLink]: (url) => ipcRenderer.invoke(Ipc_OpenLink, url)
});
