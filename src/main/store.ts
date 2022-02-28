import Store from 'electron-store';

export enum StoreKeys {
    configurationName = 'configurationName',
    clientId = 'clientId',
    clientSecret = 'clientSecret',
    tenantId = 'tenantId',
    subscriptionId = 'subscriptionId',
    redirectUri = 'redirectUri',
    aadEndpointHost = 'aadEndpointHost',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    appProtocolName = 'appProtocolName'
}

interface StoreType {
    configurationName: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadEndpointHost: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    appProtocolName: string;
}

const store = new Store<StoreType>({
    defaults: {
        configurationName: '',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        subscriptionId: '',
        redirectUri: '',
        aadEndpointHost: 'https://login.microsoftonline.com/',
        graphEndpointHost: 'https://graph.microsoft.com/',
        graphMeEndpoint: 'v1.0/me',
        appProtocolName: ''
    }
});

export default store;
