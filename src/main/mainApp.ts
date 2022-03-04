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
import {
    UserProfileScope,
    AzureManagementScope,
    IoTCentralApiScope,
    AuthProvider
} from './authProvider/authProvider';
import {
    Ipc_Log,
    Ipc_GetLastOAuthError,
    Ipc_SetLastOAuthError,
    Ipc_OpenConfiguration,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    Ipc_GetIotcApps,
    Ipc_GetIotcDevices,
    Ipc_OpenLink,
    IMsalConfig,
    IIotCentralApp,
    IIotCentralDevice
} from './contextBridgeTypes';
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
        // ContextBridge event handlers

        ipcMain.handle(Ipc_Log, async (_event: IpcMainInvokeEvent, tags: string[], message: string): Promise<void> => {
            logger.log(tags, message);
        });

        ipcMain.handle(Ipc_GetLastOAuthError, async (_event: IpcMainInvokeEvent): Promise<string> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetLastOAuthError} handler`);

            return store.get(StoreKeys.lastOAuthError);
        });

        ipcMain.handle(Ipc_SetLastOAuthError, async (_event: IpcMainInvokeEvent, message: string): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_SetLastOAuthError} handler`);

            store.set(StoreKeys.lastOAuthError, message);
        });

        ipcMain.handle(Ipc_OpenConfiguration, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_OpenConfiguration} handler`);

            const openFileResult = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Open IoT Central configuration',
                defaultPath: app.getPath('home'),
                buttonLabel: 'Open config',
                properties: ['openFile']
            });

            const configFile = openFileResult.canceled ? '' : openFileResult.filePaths[0];
            if (configFile) {
                logger.log([ModuleName, 'info'], `ipcMain ${Ipc_OpenConfiguration} handler`);
            }

            return 'foo';
        });

        ipcMain.handle(Ipc_SetMsalConfig, async (_event: IpcMainInvokeEvent, msalConfig: IMsalConfig): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_SetMsalConfig} handler`);

            store.set(StoreKeys.clientId, msalConfig.clientId);
            store.set(StoreKeys.clientSecret, msalConfig.clientSecret || '');
            store.set(StoreKeys.tenantId, msalConfig.tenantId);
            store.set(StoreKeys.subscriptionId, msalConfig.subscriptionId);
            store.set(StoreKeys.redirectUri, msalConfig.redirectUri);
            store.set(StoreKeys.aadAuthority, msalConfig.aadAuthority);
            store.set(StoreKeys.appProtocolName, msalConfig.appProtocolName);
        });

        ipcMain.handle(Ipc_GetMsalConfig, async (_event: IpcMainInvokeEvent): Promise<IMsalConfig> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetMsalConfig} handler`);

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

        ipcMain.handle(Ipc_Signin, async (_event: IpcMainInvokeEvent, redirectPath?: string): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_Signin} handler`);

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
                logger.log([ModuleName, 'error'], `Error during ${Ipc_Signin} handler: ${ex.message}`);
            }

            return accountInfo;
        });

        ipcMain.handle(Ipc_Signout, async (_event: IpcMainInvokeEvent): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_Signout} handler`);

            try {
                await this.authProvider.signout();

                await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_Signout} handler: ${ex.message}`);
            }
        });

        ipcMain.handle(Ipc_GetAccount, async (_event: IpcMainInvokeEvent): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetAccount} handler`);

            let account;

            try {
                account = this.authProvider.getCurrentAccount();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_GetAccount} handler: ${ex.message}`);
            }

            return account;
        });

        ipcMain.handle(Ipc_GetProfile, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetProfile} handler`);

            let graphResponse;

            try {
                const token = await this.authProvider.getScopedToken(UserProfileScope);

                graphResponse = await this.authProvider.callEndpointWithToken(`${store.get(StoreKeys.graphEndpointHost)}${store.get(StoreKeys.graphMeEndpoint)}`, token);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_GetProfile} handler: ${ex.message}`);
            }

            return graphResponse;
        });

        ipcMain.handle(Ipc_RequestApi, async (_event: IpcMainInvokeEvent, config: any): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_RequestApi} handler`);

            let response;

            try {
                response = await requestApi(config);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_RequestApi} handler: ${ex.message}`);
            }

            return response;
        });

        ipcMain.handle(Ipc_GetIotcApps, async (_event: IpcMainInvokeEvent): Promise<IIotCentralApp[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetIotcApps} handler`);

            let iotcApps: IIotCentralApp[] = [];

            try {
                iotcApps = await this.getIotCentralApps();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_GetIotcApps} handler: ${ex.message}`);
            }

            return iotcApps;
        });

        ipcMain.handle(Ipc_GetIotcDevices, async (_event: IpcMainInvokeEvent, appSubdomain: string): Promise<IIotCentralDevice[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetIotcDevices} handler`);

            let iotcDevices: IIotCentralDevice[] = [];

            try {
                iotcDevices = await this.getIotCentralDevices(appSubdomain);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${Ipc_GetIotcDevices} handler: ${ex.message}`);
            }

            return iotcDevices;
        });

        ipcMain.handle(Ipc_OpenLink, async (_event: IpcMainInvokeEvent, url: string): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_OpenLink} handler`);

            void shell.openExternal(url);
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

        let iotcApps: IIotCentralApp[] = [];

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
                iotcApps = (response?.payload?.value || []).reduce((result: any[], iotcApp: any) => {
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

        return iotcApps;
    }

    private async getIotCentralDevices(appSubdomain: string): Promise<IIotCentralDevice[]> {
        logger.log([ModuleName, 'info'], `getIotCentralDevices`);

        let iotcDevices: IIotCentralDevice[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'get',
                url: `https://${appSubdomain}.azureiotcentral.com/api/devices?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response) {
                iotcDevices = (response?.payload?.value || []).map((element: any) => {
                    return {
                        id: element.id,
                        displayName: element.displayName
                    };
                });
            }
            else {
                logger.log([ModuleName, 'error'], `Error during getIotCentralDevices`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralDevices: ${ex.message}`);
        }

        return iotcDevices;
    }
}
