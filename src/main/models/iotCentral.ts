export const IoTCentralBaseDomain = 'azureiotcentral.com';

export interface IIotCentralApp {
    id: string;
    name: string;
    location: string;
    applicationId: string;
    displayName: string;
    subdomain: string;
}

export interface IIotCentralDevice {
    id: string;
    displayName: string;
}
