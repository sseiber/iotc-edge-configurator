/* eslint-disable max-len */
import {
    app as electronApp,
    shell,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    dialog,
    app
} from 'electron';
import logger from './logger';
import MenuBuilder from './menu';
import * as contextBridgeTypes from './contextBridgeTypes';
import {
    MsalAuthProvider
} from './providers/auth/msalAuth';
import { IoTCentralProvider } from './providers/iotCentral';
import { IndustrialConnectProvider } from './providers/industrialConnect';
import { requestApi } from './utils';
import { join as pathJoin } from 'path';
import { platform as osPlatform } from 'os';

const ModuleName = 'MainApp';

// Magic constants produced by Forge's webpack to locate the main entry and preload files.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class MainApp {
    private mainWindow: BrowserWindow = null;
    private authProvider: MsalAuthProvider = null;
    private iotCentralProvider: IoTCentralProvider;
    private industrialConnectProvider: IndustrialConnectProvider;

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

        this.authProvider = new MsalAuthProvider(ipcMain, this.mainWindow, MAIN_WINDOW_WEBPACK_ENTRY);

        // initialize the auth provider from the cache for app startup
        await this.authProvider.initialize();

        this.iotCentralProvider = new IoTCentralProvider(ipcMain, this.mainWindow, this.authProvider);
        await this.iotCentralProvider.initialize();

        this.industrialConnectProvider = new IndustrialConnectProvider(ipcMain, this.mainWindow, this.authProvider);
        await this.industrialConnectProvider.initialize();

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
