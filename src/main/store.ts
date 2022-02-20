import Store from 'electron-store';

export enum StoreKeys {
    clientId = 'clientId',
    tenantId = 'tenantId',
    redirectUri = 'redirectUri',
    aadEndpointHost = 'aadEndpointHost',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint'
}

interface StoreType {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    aadEndpointHost: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
}

const store = new Store<StoreType>({
    defaults: {
        clientId: '',
        tenantId: '',
        redirectUri: '',
        aadEndpointHost: '',
        graphEndpointHost: '',
        graphMeEndpoint: ''
    }
});

export default store;
