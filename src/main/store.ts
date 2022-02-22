import Store from 'electron-store';

export enum StoreKeys {
    clientId = 'clientId',
    tenantId = 'tenantId',
    redirectUri = 'redirectUri',
    aadEndpointHost = 'aadEndpointHost',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    tokenCachePath = 'tokenCachePath',
    tokenCacheName = 'tokenCacheName',
    appProtocolName = 'appProtocolName'
}

interface StoreType {
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

const store = new Store<StoreType>({
    defaults: {
        clientId: '',
        tenantId: '',
        redirectUri: 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971://auth',
        aadEndpointHost: 'https://login.microsoftonline.com/common',
        graphEndpointHost: 'https://graph.microsoft.com/v1.0/me',
        graphMeEndpoint: '',
        tokenCachePath: '.webpack/data',
        tokenCacheName: 'cache.json',
        appProtocolName: 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971'
    }
});

export default store;
