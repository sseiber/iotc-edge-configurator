import Store from 'electron-store';

export enum StoreKeys {
    configurationName = 'configurationName',
    clientId = 'clientId',
    tenantId = 'tenantId',
    redirectUri = 'redirectUri',
    aadEndpointHost = 'aadEndpointHost',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    appProtocolName = 'appProtocolName'
}

interface StoreType {
    configurationName: string;
    clientId: string;
    tenantId: string;
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
        tenantId: '',
        redirectUri: 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971://auth',
        aadEndpointHost: 'https://login.microsoftonline.com/',
        graphEndpointHost: 'https://graph.microsoft.com/',
        graphMeEndpoint: '',
        appProtocolName: 'msal4072cff6-8d4f-49e8-ac6c-fead2b684971'
    }
});

export default store;
