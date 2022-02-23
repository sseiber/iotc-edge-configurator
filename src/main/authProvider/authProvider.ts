import {
    BrowserWindow
} from 'electron';
// import { cachePlugin } from './cachePlugin';
import { FileProtocolAuthorizationCodeListener } from './FileProtocolAuthorizationCodeListener';
import store, { StoreKeys } from '../store';
import {
    PublicClientApplication,
    LogLevel,
    CryptoProvider,
    AccountInfo,
    AuthenticationResult,
    AuthorizationUrlRequest,
    AuthorizationCodeRequest,
    SilentFlowRequest
} from '@azure/msal-node';
import axios from 'axios';
import logger from '../logger';

const ModuleName = 'authProvider';

export interface IMsalConfig {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    aadEndpointHost: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    tokenCachePath: string;
    tokenCacheName: string;
    appProtocolName: string;
}

// Configuration object to be passed to MSAL instance on creation.
// For a full list of MSAL Node configuration parameters, visit:
// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
// const MSAL_CONFIG: Configuration = {
//     auth: {
//         clientId: '<CLIENT_ID>',
//         authority: 'https://login.windows-ppe.net/common/'
//     },
//     cache: {
//         cachePlugin
//     },
//     system: {
//         loggerOptions: {
//             loggerCallback(_loglevel: any, message: any, _containsPii: any) {
//                 logger.log([ModuleName, 'info'], message);
//             },
//             piiLoggingEnabled: false,
//             logLevel: LogLevel.Info
//         }
//     }
// };

export class AuthProvider {
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authCodeUrlParams: AuthorizationUrlRequest;
    private authCodeRequest: AuthorizationCodeRequest;
    private silentProfileRequest: SilentFlowRequest;

    public get currentAccount(): AccountInfo {
        return this.account;
    }

    public async initialize(): Promise<boolean> {
        logger.log([ModuleName, 'info'], `initialize`);

        let result = true;

        try {
            // Initialize a public client application. For more information, visit:
            // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
            this.clientApplication = new PublicClientApplication({
                auth: {
                    clientId: store.get(StoreKeys.clientId),
                    authority: `${store.get(StoreKeys.aadEndpointHost)}${store.get(StoreKeys.tenantId)}`
                },
                // cache: {
                //     cachePlugin
                // },
                system: {
                    loggerOptions: {
                        loggerCallback(_loglevel: LogLevel, message: string, _containsPii: boolean) {
                            logger.log(['Azure/msal-node', 'info'], message);
                        },
                        piiLoggingEnabled: false,
                        logLevel: LogLevel.Verbose
                    }
                }
            });

            this.setRequestObjects();

            this.account = await this.signinSilent();
            if (this.account) {
                logger.log([ModuleName, 'info'], 'Successful silent account retrieval');
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `initialize error: ${ex.message}`);

            result = false;
        }

        return result;
    }

    public async signin(authWindow: BrowserWindow): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signin`);

        authWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
            logger.log([ModuleName, 'info'], `will-redirect url found: ${responseUrl}`);
        });

        const authResponse = await this.getTokenInteractive(authWindow, this.authCodeUrlParams);
        if (authResponse !== null) {
            this.account = authResponse.account;
        }
        else {
            this.account = await this.getAccount();
        }

        return this.account;
    }

    public async signinSilent(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signinSilent`);

        if (!this.account) {
            this.account = await this.getAccount();
        }

        return this.account;
    }

    public async signout(): Promise<void> {
        logger.log([ModuleName, 'info'], `signin`);

        try {
            if (this.account) {
                await this.clientApplication.getTokenCache().removeAccount(this.account);

                this.account = null;
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during signout: ${ex.message}`);
        }
    }

    public async callEndpointWithToken(graphEndpointUrl: string, token: string): Promise<any> {
        logger.log([ModuleName, 'info'], `callEndpointWithToken`);

        const response = {
            statusCode: 200,
            message: 'SUCCESS',
            payload: {}
        };

        try {
            const options = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const axiosResponse = await axios.get(graphEndpointUrl, options);

            response.statusCode = axiosResponse.status;
            response.message = axiosResponse.statusText;

            if ((axiosResponse.data as any)?.payload) {
                response.payload = (axiosResponse.data as any).payload;
            }
        }
        catch (ex) {
            if (ex.isAxiosError && ex.response) {
                response.statusCode = ex.response.statusCode;
                response.message = `An error occurred during the request: ${ex.response.status}`;
            }
            else {
                response.statusCode = 500;
                response.message = `An error occurred during the request: ${ex.message}`;
            }
        }

        return response;
    }

    // Initialize request objects used by this AuthModule.
    private setRequestObjects(): void {
        logger.log([ModuleName, 'info'], `setRequestObjects`);

        const baseSilentRequest = {
            // @ts-ignore
            account: null,
            forceRefresh: false
        };

        const requestScopes = ['User.Read'];
        const redirectUri = store.get(StoreKeys.redirectUri);

        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri
        };

        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri,
            code: ''
        };

        this.silentProfileRequest = {
            ...baseSilentRequest,
            scopes: ['User.Read']
        };
    }

    public async getProfileToken(authWindow: BrowserWindow): Promise<string> {
        logger.log([ModuleName, 'info'], `getProfileToken`);

        return this.getToken(authWindow, this.silentProfileRequest);
    }

    public async getToken(authWindow: BrowserWindow, tokenRequest: SilentFlowRequest): Promise<string> {
        logger.log([ModuleName, 'info'], `getToken`);

        let authenticationResult: AuthenticationResult;

        const account = this.account || await this.getAccount();
        if (account) {
            tokenRequest.account = account;
            authenticationResult = await this.getTokenSilent(authWindow, tokenRequest);
        }
        else {
            const authCodeRequest = { ...this.authCodeUrlParams, ...tokenRequest };
            authenticationResult = await this.getTokenInteractive(authWindow, authCodeRequest);
        }

        return authenticationResult?.accessToken || null;
    }

    private async getTokenSilent(authWindow: BrowserWindow, tokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenSilent`);

        let authenticationResult;

        try {
            authenticationResult = await this.clientApplication.acquireTokenSilent(tokenRequest);
        }
        catch (ex) {
            logger.log([ModuleName, 'info'], `Silent token acquisition failed, acquiring token using pop up`);

            authenticationResult = null;
        }

        if (!authenticationResult) {
            try {
                const authCodeRequest = { ...this.authCodeUrlParams, ...tokenRequest };

                authenticationResult = await this.getTokenInteractive(authWindow, authCodeRequest);
            }
            catch (ex) {
                logger.log([ModuleName, 'info'], `Silent token acquisition failed, acquiring token using pop up`);

                authenticationResult = null;
            }
        }

        return authenticationResult;
    }

    // This method contains an implementation of access token acquisition in authorization code flow
    private async getTokenInteractive(authWindow: BrowserWindow, tokenRequest: any): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenInteractive`);

        // Proof Key for Code Exchange (PKCE) Setup

        // MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
        // in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
        // second leg (acquireTokenByCode() API).

        // MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
        // the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
        // and challenge values should be generated previous to the authorization flow initiation.

        // For details on PKCE code generation logic, consult the
        // PKCE specification https://tools.ietf.org/html/rfc7636#section-4

        let authenticationResult;

        try {
            const cryptoProvider = new CryptoProvider();
            const { challenge, verifier } = await cryptoProvider.generatePkceCodes();

            const authCodeUrlParams = {
                ...this.authCodeUrlParams,
                scopes: tokenRequest.scopes,
                codeChallenge: challenge, // PKCE Code Challenge
                codeChallengeMethod: 'S256' // PKCE Code Challenge Method
            };

            // Get Auth Code URL
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);

            const authCode = await this.listenForAuthorizationCode(authCodeUrl, authWindow);

            // Use Authorization Code and PKCE Code verifier to make token request
            authenticationResult = this.clientApplication.acquireTokenByCode({
                ...this.authCodeRequest,
                code: authCode,
                codeVerifier: verifier
            });
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `getTokenInteractive error: ${ex.message}`);

            authenticationResult = null;
        }

        return authenticationResult;
    }

    private async listenForAuthorizationCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        logger.log([ModuleName, 'info'], `listenForAuthorizationCode`);

        // Set up custom file protocol to listen for redirect response
        const authCodeListener = new FileProtocolAuthorizationCodeListener(store.get(StoreKeys.appProtocolName));
        const codePromise = authCodeListener.registerProtocolAndStartListening();

        await authWindow.loadURL(navigateUrl);

        const code = await codePromise;

        authCodeListener.unregisterProtocol();

        return code;
    }

    // private async listenForAuthorizationCode2(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
    //     logger.log([ModuleName, 'info'], `listenForAuthCode`);

    //     let authCode = '';

    //     try {
    //         await authWindow.loadURL(navigateUrl);

    //         authCode = await new Promise((resolve, reject) => {
    //             authWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
    //                 try {
    //                     const parsedUrl = new URL(responseUrl);
    //                     return resolve(parsedUrl.searchParams.get('code'));
    //                 }
    //                 catch (err) {
    //                     return reject(err);
    //                 }
    //             });
    //         });
    //     }
    //     catch (ex) {
    //         logger.log([ModuleName, 'error'], `listenForAuthorizationCode error: ${ex.message}`);
    //     }

    //     return authCode;
    // }

    // Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
    private async getAccount(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `getAccount`);

        let accountResult;

        try {
            const cache = this.clientApplication.getTokenCache();
            const currentAccounts = await cache.getAllAccounts();

            if (currentAccounts === null) {
                logger.log([ModuleName, 'info'], 'No accounts detected');
            }
            else if (currentAccounts.length > 1) {
                // Add choose account code here
                logger.log([ModuleName, 'info'], 'Multiple accounts detected, need to add choose account code.');

                accountResult = currentAccounts[0];
            }
            else if (currentAccounts.length === 1) {
                accountResult = currentAccounts[0];
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `getAccount error: ${ex.message}`);
        }

        return accountResult;
    }
}
