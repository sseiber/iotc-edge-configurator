import {
    protocol,
    BrowserWindow
} from 'electron';
import store, { StoreKeys } from './store';
import {
    PublicClientApplication,
    LogLevel,
    CryptoProvider,
    AccountInfo,
    AuthenticationResult
} from '@azure/msal-node';
import {
    // join as pathJoin,
    normalize as pathNormalize
} from 'path';
import { parse as urlParse } from 'url';
import axios from 'axios';
import { logger } from './logger';

const ModuleName = 'authProvider';

export interface IMsalConfig {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    aadEndpointHost: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    graphScopes: string;
}

// Configuration object to be passed to MSAL instance on creation.
// For a full list of MSAL Node configuration parameters, visit:
// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
// const MsalConfig = {
//     auth: {
//         clientId: process.env.CLIENT_ID,
//         authority: `${process.env.AAD_ENDPOINT_HOST}${process.env.TENANT_ID}`,
//         redirectUri: process.env.REDIRECT_URI
//     },
//     system: {
//         loggerOptions: {
//             loggerCallback(_loglevel: LogLevel, message: string, _containsPii: boolean) {
//                 // eslint-disable-next-line no-console
//                 console.log(message);
//             },
//             piiLoggingEnabled: false,
//             logLevel: LogLevel.Verbose
//         }
//     }
// };

export class AuthProvider {
    private clientApplication: PublicClientApplication;
    private cryptoProvider: CryptoProvider;
    private authCodeUrlParams: any;
    private authCodeRequest: any;
    private pkceCodes: any;
    private account: AccountInfo;

    public initialize(): boolean {
        logger([ModuleName, 'info'], `initialize`);

        let result = true;

        try {
            // Initialize a public client application. For more information, visit:
            // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
            this.clientApplication = new PublicClientApplication({
                auth: {
                    clientId: store.get(StoreKeys.clientId),
                    authority: `${store.get(StoreKeys.aadEndpointHost)}${store.get(StoreKeys.tenantId)}`
                },
                system: {
                    loggerOptions: {
                        loggerCallback(_loglevel: LogLevel, message: string, _containsPii: boolean) {
                            // eslint-disable-next-line no-console
                            console.log(message);
                        },
                        piiLoggingEnabled: false,
                        logLevel: LogLevel.Verbose
                    }
                }
            });
            this.account = null;

            // Initialize CryptoProvider instance
            this.cryptoProvider = new CryptoProvider();

            this.setRequestObjects();
        }
        catch (ex) {
            logger([ModuleName, 'error'], `initialize error: ${ex.message}`);

            result = false;
        }

        return result;
    }

    public async signin(authWindow: BrowserWindow): Promise<AccountInfo> {
        logger([ModuleName, 'info'], `signin`);

        let authResult;

        try {
            authResult = await this.getTokenInteractive(authWindow, this.authCodeUrlParams);
        }
        catch (ex) {
            logger([ModuleName, 'error'], `Error during signin: ${ex.message}`);
        }

        return this.handleResponse(authResult);
    }

    public async signout(): Promise<void> {
        logger([ModuleName, 'info'], `signin`);

        try {
            if (this.account) {
                await this.clientApplication.getTokenCache().removeAccount(this.account);

                this.account = null;
            }
        }
        catch (ex) {
            logger([ModuleName, 'error'], `Error during signout: ${ex.message}`);
        }
    }

    public async getToken(authWindow: BrowserWindow, tokenRequest: any): Promise<string> {
        logger([ModuleName, 'info'], `getToken`);

        let authResponse;

        try {
            authResponse = await this.getTokenInteractive(authWindow, tokenRequest);
        }
        catch (ex) {
            logger([ModuleName, 'error'], `getToken error: ${ex.message}`);
        }

        return authResponse?.accessToken || null;
    }

    public async callEndpointWithToken(graphEndpointUrl: string, token: string): Promise<any> {
        logger([ModuleName, 'info'], `callEndpointWithToken`);

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
        const requestScopes = ['openid', 'profile', 'User.Read'];
        const redirectUri = store.get(StoreKeys.redirectUri);

        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri
        };

        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri,
            code: null
        };

        this.pkceCodes = {
            challengeMethod: 'S256', // Use SHA256 Algorithm
            verifier: '', // Generate a code verifier for the Auth Code Request first
            challenge: '' // Generate a code challenge from the previously generated code verifier
        };
    }

    // This method contains an implementation of access token acquisition in authorization code flow
    private async getTokenInteractive(authWindow: BrowserWindow, tokenRequest: any): Promise<AuthenticationResult> {
        logger([ModuleName, 'info'], `getTokenInteractive`);

        // Proof Key for Code Exchange (PKCE) Setup

        // MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
        // in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
        // second leg (acquireTokenByCode() API).

        // MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
        // the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
        // and challenge values should be generated previous to the authorization flow initiation.

        // For details on PKCE code generation logic, consult the
        // PKCE specification https://tools.ietf.org/html/rfc7636#section-4

        let authResponse;

        try {
            const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

            this.pkceCodes.verifier = verifier;
            this.pkceCodes.challenge = challenge;

            const authCodeUrlParams = {
                ...this.authCodeUrlParams,
                scopes: tokenRequest.scopes,
                codeChallenge: this.pkceCodes.challenge, // PKCE Code Challenge
                codeChallengeMethod: this.pkceCodes.challengeMethod // PKCE Code Challenge Method
            };

            const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);

            // To demonstrate best security practices, this Electron sample application makes use of
            // a custom file protocol instead of a regular web (https://) redirect URI in order to
            // handle the redirection step of the authorization flow, as suggested in the OAuth2.0
            // specification for Native Apps.
            const customFileProtocolName = store.get(StoreKeys.redirectUri).split(':')[0]; // e.g. 'msal'

            protocol.registerFileProtocol(customFileProtocolName, (req, callback) => {
                const requestUrl = urlParse(req.url, true);
                callback(pathNormalize(`${__dirname}/${requestUrl.path}`));
            });

            const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);

            authResponse = await this.clientApplication.acquireTokenByCode({
                ...this.authCodeRequest,
                scopes: tokenRequest.scopes,
                code: authCode,
                codeVerifier: this.pkceCodes.verifier // PKCE Code Verifier
            });
        }
        catch (ex) {
            logger([ModuleName, 'error'], `getTokenInteractive error: ${ex.message}`);
        }

        return authResponse;
    }

    // Listen for authorization code response from Azure AD
    private async listenForAuthCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        logger([ModuleName, 'info'], `listenForAuthCode`);

        let authCode = '';

        try {
            await authWindow.loadURL(navigateUrl);

            authCode = await new Promise((resolve, reject) => {
                authWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
                    try {
                        const parsedUrl = new URL(responseUrl);
                        return resolve(parsedUrl.searchParams.get('code'));
                    }
                    catch (err) {
                        return reject(err);
                    }
                });
            });
        }
        catch (ex) {
            logger([ModuleName, 'error'], `listenForAuthCode error: ${ex.message}`);
        }

        return authCode;
    }

    // Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
    private async handleResponse(response: AuthenticationResult): Promise<AccountInfo> {
        logger([ModuleName, 'info'], `handleResponse`);

        try {
            if (response !== null) {
                this.account = response.account;
            }
            else {
                this.account = await this.getAccount();
            }
        }
        catch (ex) {
            logger([ModuleName, 'error'], `handleResponse error: ${ex.message}`);
        }

        return this.account;
    }

    // Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
    private async getAccount(): Promise<AccountInfo> {
        logger([ModuleName, 'info'], `getAccount`);

        let accountResult;

        try {
            const cache = this.clientApplication.getTokenCache();
            const currentAccounts = await cache.getAllAccounts();

            if (currentAccounts === null) {
                logger([ModuleName, 'info'], 'No accounts detected');
            }
            else if (currentAccounts.length > 1) {
                // Add choose account code here
                logger([ModuleName, 'info'], 'Multiple accounts detected, need to add choose account code.');

                accountResult = currentAccounts[0];
            }
            else if (currentAccounts.length === 1) {
                accountResult = currentAccounts[0];
            }
        }
        catch (ex) {
            logger([ModuleName, 'error'], `getAccount error: ${ex.message}`);
        }

        return accountResult;
    }
}
