// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcApi', {
    log: (tags, message) => ipcRenderer.invoke('log', tags, message),
    setMsalConfig: (msalConfig) => ipcRenderer.invoke('setMsalConfig', msalConfig)
});
