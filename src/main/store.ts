import Store from 'electron-store';
import {
    IAdapterConfiguration
} from '../main/models/industrialConnect';

export enum StoreKeys {
    lastOAuthError = 'lastOAuthError',
    configurationName = 'configurationName',
    clientId = 'clientId',
    clientSecret = 'clientSecret',
    tenantId = 'tenantId',
    subscriptionId = 'subscriptionId',
    redirectUri = 'redirectUri',
    aadAuthority = 'aadAuthority',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    appProtocolName = 'appProtocolName',
    adapterConfigCache = 'adapterConfigCache'
}

interface StoreType {
    lastOAuthError: string;
    configurationName: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadAuthority: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    appProtocolName: string;
    adapterConfigCache: IAdapterConfiguration[];
}

const store = new Store<StoreType>({
    defaults: {
        lastOAuthError: '',
        configurationName: '',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        subscriptionId: '',
        redirectUri: '',
        aadAuthority: 'https://login.microsoftonline.com/common/',
        graphEndpointHost: 'https://graph.microsoft.com/',
        graphMeEndpoint: 'v1.0/me',
        appProtocolName: '',
        adapterConfigCache: []
    }
});

export default store;
