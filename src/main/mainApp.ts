import {
    app as electronApp,
    shell,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    dialog,
    app
} from 'electron';
import store, { StoreKeys } from './store';
import logger from './logger';
import MenuBuilder from './menu';
import * as contextBridgeTypes from './contextBridgeTypes';
import {
    UserProfileScope,
    AzureManagementScope,
    IoTCentralApiScope,
    IMsalConfig,
    AuthProvider
} from './authProvider/authProvider';
import {
    IoTCentralBaseDomain,
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../main/models/iotCentral';
import {
    IndustrialConnectModuleName,
    IndustrialConnectCommands,
    Endpoint
} from '../main/models/industrialConnect';
import { AccountInfo } from '@azure/msal-node';
import { requestApi } from './utils';
import { join as pathJoin } from 'path';
import { platform as osPlatform } from 'os';

// Magic constants produced by Forge's webpack to locate the main entry and preload files.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const ModuleName = 'MainApp';

export class MainApp {
    private mainWindow: BrowserWindow = null;
    private authProvider: AuthProvider = null;

    constructor() {
        this.registerEventHandlers();
    }

    public async initializeApp(): Promise<void> {
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_WEBPACK_ENTRY: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);

        // Create the main browser window
        this.createMainWindow();

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        this.authProvider = new AuthProvider(this.mainWindow);

        // initialize the auth provider from the cache for app startup
        await this.authProvider.initialize();

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            // this.mainWindow.webContents.openDevTools();
        });

        // and load the index.html of the app
        await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    public createMainWindow(): void {
        logger.log([ModuleName, 'info'], `createMainWindow`);

        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 768,
            show: false,
            icon: pathJoin(this.getAssetsPath(), osPlatform() === 'win32' ? 'icon.ico' : 'icons/64x64.png'),
            webPreferences: {
                // nodeIntegration: true,
                contextIsolation: true,
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        this.mainWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
            logger.log([ModuleName, 'info'], `will-redirect url found: ${responseUrl}`);
        });
    }

    private getAssetsPath(): string {
        return electronApp.isPackaged
            ? pathJoin(process.resourcesPath, 'assets')
            : pathJoin(__dirname, '../renderer/assets');
    }

    private registerEventHandlers(): void {
        //
        // Main process event handlers
        //
        ipcMain.handle(contextBridgeTypes.Ipc_Log, async (_event: IpcMainInvokeEvent, tags: string[], message: string): Promise<void> => {
            logger.log(tags, message);
        });

        ipcMain.handle(contextBridgeTypes.Ipc_OpenConfiguration, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenConfiguration} handler`);

            const openFileResult = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Open IoT Central configuration',
                defaultPath: app.getPath('home'),
                buttonLabel: 'Open config',
                properties: ['openFile']
            });

            const configFile = openFileResult.canceled ? '' : openFileResult.filePaths[0];
            if (configFile) {
                logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenConfiguration} handler`);
            }

            return 'foo';
        });

        ipcMain.handle(contextBridgeTypes.Ipc_OpenLink, async (_event: IpcMainInvokeEvent, url: string): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenLink} handler`);

            void shell.openExternal(url);
        });

        //
        // Auth event handlers
        //
        ipcMain.handle(contextBridgeTypes.Ipc_GetLastOAuthError, async (_event: IpcMainInvokeEvent): Promise<string> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetLastOAuthError} handler`);

            return store.get(StoreKeys.lastOAuthError);
        });

        ipcMain.handle(contextBridgeTypes.Ipc_SetLastOAuthError, async (_event: IpcMainInvokeEvent, message: string): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetLastOAuthError} handler`);

            store.set(StoreKeys.lastOAuthError, message);
        });

        ipcMain.handle(contextBridgeTypes.Ipc_SetMsalConfig, async (_event: IpcMainInvokeEvent, msalConfig: IMsalConfig): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetMsalConfig} handler`);

            store.set(StoreKeys.clientId, msalConfig.clientId);
            store.set(StoreKeys.clientSecret, msalConfig.clientSecret || '');
            store.set(StoreKeys.tenantId, msalConfig.tenantId);
            store.set(StoreKeys.subscriptionId, msalConfig.subscriptionId);
            store.set(StoreKeys.redirectUri, msalConfig.redirectUri);
            store.set(StoreKeys.aadAuthority, msalConfig.aadAuthority);
            store.set(StoreKeys.appProtocolName, msalConfig.appProtocolName);
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetMsalConfig, async (_event: IpcMainInvokeEvent): Promise<IMsalConfig> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetMsalConfig} handler`);

            return {
                clientId: store.get(StoreKeys.clientId),
                clientSecret: store.get(StoreKeys.clientSecret),
                tenantId: store.get(StoreKeys.tenantId),
                subscriptionId: store.get(StoreKeys.subscriptionId),
                redirectUri: store.get(StoreKeys.redirectUri),
                aadAuthority: store.get(StoreKeys.aadAuthority),
                appProtocolName: store.get(StoreKeys.appProtocolName)
            };
        });

        ipcMain.handle(contextBridgeTypes.Ipc_Signin, async (_event: IpcMainInvokeEvent, redirectPath?: string): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_Signin} handler`);

            let accountInfo;

            try {
                // use a separate window for a pop-up login ui experience
                // const authWindow = this.createAuthWindow();

                // re-initialize the auth provider from the cache
                // in case the user has changed the Azure MSAL configuration
                await this.authProvider.initialize();

                accountInfo = await this.authProvider.signin();

                const mainEntryUrl = new URL(MAIN_WINDOW_WEBPACK_ENTRY);

                if (redirectPath) {
                    mainEntryUrl.searchParams.set('redirectpath', redirectPath);
                }

                await this.mainWindow.loadURL(mainEntryUrl.href);

                // authWindow.close();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_Signin} handler: ${ex.message}`);
            }

            return accountInfo;
        });

        ipcMain.handle(contextBridgeTypes.Ipc_Signout, async (_event: IpcMainInvokeEvent): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_Signout} handler`);

            try {
                await this.authProvider.signout();

                await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_Signout} handler: ${ex.message}`);
            }
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetAccount, async (_event: IpcMainInvokeEvent): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetAccount} handler`);

            let account;

            try {
                account = this.authProvider.getCurrentAccount();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetAccount} handler: ${ex.message}`);
            }

            return account;
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetProfile, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetProfile} handler`);

            let graphResponse;

            try {
                const token = await this.authProvider.getScopedToken(UserProfileScope);

                graphResponse = await this.authProvider.callEndpointWithToken(`${store.get(StoreKeys.graphEndpointHost)}${store.get(StoreKeys.graphMeEndpoint)}`, token);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetProfile} handler: ${ex.message}`);
            }

            return graphResponse;
        });

        //
        // IoT Central event handlers
        //

        ipcMain.handle(contextBridgeTypes.Ipc_RequestApi, async (_event: IpcMainInvokeEvent, config: any): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

            let response;

            try {
                response = await requestApi(config);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_RequestApi} handler: ${ex.message}`);
            }

            return response;
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetIotcApps, async (_event: IpcMainInvokeEvent): Promise<IIotCentralApp[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcApps} handler`);

            let apps: IIotCentralApp[] = [];

            try {
                apps = await this.getIotCentralApps();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcApps} handler: ${ex.message}`);
            }

            return apps;
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetIotcDevices, async (_event: IpcMainInvokeEvent, appSubdomain: string): Promise<IIotCentralDevice[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcDevices} handler`);

            let devices: IIotCentralDevice[] = [];

            try {
                devices = await this.getIotCentralDevices(appSubdomain);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcDevices} handler: ${ex.message}`);
            }

            return devices;
        });

        ipcMain.handle(contextBridgeTypes.Ipc_GetIotcDeviceModules, async (_event: IpcMainInvokeEvent, appSubdomain: string, deviceId: string): Promise<IIotCentralModule[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcDeviceModules} handler`);

            let modules: IIotCentralModule[] = [];

            try {
                modules = await this.getIotCentralDeviceModules(appSubdomain, deviceId);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcDeviceModules} handler: ${ex.message}`);
            }

            return modules;
        });

        // eslint-disable-next-line max-len
        ipcMain.handle(contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint, async (_event: IpcMainInvokeEvent, opcEndpoint: Endpoint, appSubdomain: string, gatewayId: string): Promise<boolean> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint} handler`);

            let connectionGood;

            try {
                connectionGood = await this.testIndustrialConnectEndpoint(opcEndpoint, appSubdomain, gatewayId);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_TestIndustrialConnectEndpoint} handler: ${ex.message}`);
            }

            return connectionGood;
        });
    }

    // private createAuthWindow(): BrowserWindow {
    //     logger.log([ModuleName, 'info'], `createAuthWindow`);

    //     const window = new BrowserWindow({
    //         width: 400,
    //         height: 600
    //     });

    //     window.on('closed', () => {
    //         logger.log([ModuleName, 'info'], `Main window received 'close'`);

    //         this.mainWindow = null;
    //     });

    //     return window;
    // }

    private async getIotCentralApps(): Promise<IIotCentralApp[]> {
        logger.log([ModuleName, 'info'], `getIotCentralApps`);

        let apps: IIotCentralApp[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(AzureManagementScope);
            const config = {
                method: 'get',
                url: `https://management.azure.com/subscriptions/${store.get(StoreKeys.subscriptionId)}/providers/Microsoft.IoTCentral/iotApps?api-version=2021-06-01`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response) {
                apps = (response?.payload?.value || []).reduce((result: IIotCentralApp[], iotcApp: any): IIotCentralApp[] => {
                    if (iotcApp.tags?.integrationType === 'industrial-connect') {
                        return result.concat({
                            id: iotcApp.id,
                            name: iotcApp.name,
                            location: iotcApp.location,
                            applicationId: iotcApp.properties.applicationId,
                            displayName: iotcApp.properties.displayName,
                            subdomain: iotcApp.properties.subdomain
                        });
                    }
                    return result;
                }, []);
            }
            else {
                logger.log([ModuleName, 'error'], `Error during getIotCentralApps`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralApps: ${ex.message}`);
        }

        return apps;
    }

    private async getIotCentralDevices(appSubdomain: string): Promise<IIotCentralDevice[]> {
        logger.log([ModuleName, 'info'], `getIotCentralDevices`);

        let devices: IIotCentralDevice[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'get',
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 200) {
                devices = (response?.payload?.value || []).map((device: IIotCentralDevice): IIotCentralDevice => {
                    return {
                        id: device.id,
                        displayName: device.displayName
                    };
                });
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralDevices: ${ex.message}`);
        }

        return devices;
    }

    private async getIotCentralDeviceModules(appSubdomain: string, deviceId: string): Promise<IIotCentralModule[]> {
        logger.log([ModuleName, 'info'], `getIotCentralDevices`);

        let modules: IIotCentralModule[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'get',
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/modules?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 200) {
                modules = (response?.payload?.value || []).map((module: IIotCentralModule): IIotCentralModule => {
                    return {
                        name: module.name,
                        displayName: module.displayName
                    };
                });
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralDeviceModules: ${ex.message}`);
        }

        return modules;
    }

    private async testIndustrialConnectEndpoint(opcEndpoint: Endpoint, appSubdomain: string, gatewayId: string): Promise<boolean> {
        logger.log([ModuleName, 'info'], `testIndustrialConnectEndpoint`);

        let connectionGood = false;

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'post',
                // eslint-disable-next-line max-len
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices/${gatewayId}/modules/${IndustrialConnectModuleName}/commands/${IndustrialConnectCommands.TestConnection}?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                data: {
                    connectionTimeout: 10,
                    responseTimeout: 10,
                    request: {
                        opcEndpoint
                    }
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 201 && response.payload?.responseCode === 200) {
                connectionGood = true;
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}, payload responseCode: ${response.payload?.responseCode}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during testIndustrialConnectEndpoint: ${ex.message}`);
        }

        return connectionGood;
    }
}
