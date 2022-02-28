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
import { join as pathJoin } from 'path';
import { platform as osPlatform } from 'os';
import { AuthProvider } from './authProvider/authProvider';
import {
    Ipc_Log,
    Ipc_OpenConfiguration,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    IMsalConfig,
    Ipc_OpenLink
} from './contextBridgeTypes';
import { AccountInfo } from '@azure/msal-node';
import { requestApi } from './utils';

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

        this.authProvider = new AuthProvider();

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
            store.set(StoreKeys.tenantId, msalConfig.tenantId);
            store.set(StoreKeys.redirectUri, msalConfig.redirectUri);
            store.set(StoreKeys.aadEndpointHost, msalConfig.aadEndpointHost);
            store.set(StoreKeys.appProtocolName, msalConfig.appProtocolName);
        });

        ipcMain.handle(Ipc_GetMsalConfig, async (_event: IpcMainInvokeEvent): Promise<IMsalConfig> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetMsalConfig} handler`);

            return {
                clientId: store.get(StoreKeys.clientId),
                tenantId: store.get(StoreKeys.tenantId),
                redirectUri: store.get(StoreKeys.redirectUri),
                aadEndpointHost: store.get(StoreKeys.aadEndpointHost),
                appProtocolName: store.get(StoreKeys.appProtocolName)
            };
        });

        ipcMain.handle(Ipc_Signin, async (_event: IpcMainInvokeEvent, redirectPath?: string): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_Signin} handler`);

            // use a separate window for a pop-up login ui experience
            // const authWindow = this.createAuthWindow();

            await this.authProvider.initialize();

            const accountInfo = await this.authProvider.signin(this.mainWindow);

            const mainEntryUrl = new URL(MAIN_WINDOW_WEBPACK_ENTRY);

            if (redirectPath) {
                mainEntryUrl.searchParams.set('redirectpath', redirectPath);
            }

            await this.mainWindow.loadURL(mainEntryUrl.href);

            // authWindow.close();

            return accountInfo;
        });

        ipcMain.handle(Ipc_Signout, async (_event: IpcMainInvokeEvent): Promise<void> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_Signout} handler`);

            await this.authProvider.signout();

            await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        });

        ipcMain.handle(Ipc_GetAccount, async (_event: IpcMainInvokeEvent): Promise<AccountInfo> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetAccount} handler`);

            return this.authProvider?.currentAccount;
        });

        ipcMain.handle(Ipc_GetProfile, async (_event: IpcMainInvokeEvent): Promise<any> => {
            logger.log([ModuleName, 'info'], `ipcMain ${Ipc_GetProfile} handler`);

            const token = await this.authProvider.getProfileToken(this.mainWindow);
            // const account = this.authProvider.currentAccount;

            // await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
            // Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);

            const graphResponse = await this.authProvider.callEndpointWithToken(`${store.get(StoreKeys.graphEndpointHost)}${store.get(StoreKeys.graphMeEndpoint)}`, token);

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
}
