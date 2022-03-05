import {
    BrowserWindow
} from 'electron';
import { cachePlugin } from './cachePlugin';
import { FileProtocolAuthorizationCodeListener } from './FileProtocolAuthorizationCodeListener';
import store, { StoreKeys } from '../store';
import {
    PublicClientApplication,
    LogLevel,
    CryptoProvider,
    AccountInfo,
    AuthenticationResult,
    SilentFlowRequest
} from '@azure/msal-node';
import axios from 'axios';
import logger from '../logger';

const ModuleName = 'authProvider';

const AuthCodeTimeout = 1000 * 30;

export const UserProfileScope = 'User.Read';
export const AzureManagementScope = 'https://management.azure.com/.default';
export const IoTCentralApiScope = 'https://apps.azureiotcentral.com/.default';

export interface IMsalConfig {
    clientId: string;
    clientSecret?: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadAuthority: string;
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
    private authWindow: BrowserWindow;
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;

    constructor(authWindow: BrowserWindow) {
        this.authWindow = authWindow;
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
                    authority: store.get(StoreKeys.aadAuthority)
                },
                cache: {
                    cachePlugin
                },
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

    public async signin(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signin`);

        await this.getTokenInteractive(
            this.authWindow,
            {
                scopes: [UserProfileScope],
                redirectUri: store.get(StoreKeys.redirectUri)
            }
        );

        return this.getAccount();
    }

    public async signinSilent(): Promise<AccountInfo> {
        logger.log([ModuleName, 'info'], `signinSilent`);

        return this.getAccount();
    }

    public async signout(): Promise<void> {
        logger.log([ModuleName, 'info'], `signout`);

        try {
            const account = await this.getAccount();
            if (account) {
                await this.clientApplication.getTokenCache().removeAccount(account);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during signout: ${ex.message}`);
        }
    }

    public async getCurrentAccount(): Promise<AccountInfo> {
        return this.getAccount();
    }

    public async getScopedToken(scope: string): Promise<string> {
        const account = await this.getAccount();
        const { accessToken: scopedAccessToken } = await this.getTokenSilent(
            this.authWindow,
            {
                account,
                scopes: [scope]
            }
        );

        return scopedAccessToken;
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

    public async getToken(authWindow: BrowserWindow, scopes: string[]): Promise<string> {
        logger.log([ModuleName, 'info'], `getToken`);

        let authenticationResult: AuthenticationResult;

        const account = await this.getAccount();
        if (account) {
            authenticationResult = await this.getTokenSilent(
                authWindow,
                {
                    account,
                    scopes
                }
            );
        }
        else {
            authenticationResult = await this.getTokenInteractive(
                authWindow,
                {
                    scopes,
                    redirectUri: store.get(StoreKeys.redirectUri)
                }
            );
        }

        return authenticationResult?.accessToken || '';
    }

    private async getTokenSilent(authWindow: BrowserWindow, silentFlowTokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenSilent`);

        let authenticationResult;

        try {
            authenticationResult = await this.clientApplication.acquireTokenSilent(silentFlowTokenRequest);
        }
        catch (ex) {
            logger.log([ModuleName, 'info'], `Silent token acquisition failed, acquiring token using pop up`);

            authenticationResult = null;
        }

        if (!authenticationResult) {
            try {
                authenticationResult = await this.getTokenInteractive(
                    authWindow,
                    {
                        scopes: silentFlowTokenRequest.scopes,
                        redirectUri: store.get(StoreKeys.redirectUri)
                    }
                );
            }
            catch (ex) {
                logger.log([ModuleName, 'info'], `Silent token acquisition failed`);

                authenticationResult = null;
            }
        }

        return authenticationResult;
    }

    // This method contains an implementation of access token acquisition in authorization code flow
    private async getTokenInteractive(authWindow: BrowserWindow, tokenRequest: any): Promise<AuthenticationResult> {
        logger.log([ModuleName, 'info'], `getTokenInteractive`);

        store.set(StoreKeys.lastOAuthError, '');

        // Proof Key for Code Exchange (PKCE) Setup

        // MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge
        // and codeChallengeMethod parameters in the request passed into getAuthCodeUrl() API,
        // as well as the codeVerifier parameter in the second leg (acquireTokenByCode() API).

        // MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
        // the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
        // and challenge values should be generated previous to the authorization flow initiation.

        // For details on PKCE code generation logic, consult the
        // PKCE specification https://tools.ietf.org/html/rfc7636#section-4

        let authenticationResult;

        try {
            const cryptoProvider = new CryptoProvider();
            const { challenge, verifier } = await cryptoProvider.generatePkceCodes();

            // Get Auth Code URL
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl({
                scopes: tokenRequest.scopes,
                redirectUri: tokenRequest.redirectUri,
                codeChallenge: challenge, // PKCE Code Challenge
                codeChallengeMethod: 'S256' // PKCE Code Challenge Method
            });

            const authCode = await this.listenForAuthorizationCode(authCodeUrl, authWindow);

            // Use Authorization Code and PKCE Code verifier to make token request
            // authenticationResult = await this.clientApplication.acquireTokenByCode({
            //     ...this.authAzureManagementCodeRequest,
            //     code: authCode,
            //     codeVerifier: verifier
            // });
            authenticationResult = await this.clientApplication.acquireTokenByCode({
                scopes: tokenRequest.scopes,
                redirectUri: tokenRequest.redirectUri,
                code: authCode,
                codeVerifier: verifier
            });
        }
        catch (ex) {
            store.set(StoreKeys.lastOAuthError, 'The signin process timed out while waiting for an authorization code');

            logger.log([ModuleName, 'error'], `getTokenInteractive error: ${ex.message}`);

            authenticationResult = null;
        }

        return authenticationResult;
    }

    private async listenForAuthorizationCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        logger.log([ModuleName, 'info'], `listenForAuthorizationCode`);

        // Set up custom file protocol to listen for redirect response
        const authCodeListener = new FileProtocolAuthorizationCodeListener(store.get(StoreKeys.appProtocolName));


        await authWindow.loadURL(navigateUrl);
        const code = await authCodeListener.registerProtocolAndStartListening(AuthCodeTimeout);

        authCodeListener.unregisterProtocol();

        return code;
    }

    // Calls getAllAccounts and determines the correct account to sign into,
    // currently defaults to first account found in cache.
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
