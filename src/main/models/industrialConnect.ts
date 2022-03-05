export const IndustrialConnectModuleName = 'ompadapter';
export enum IndustrialConnectCommands {
    TestConnection = 'TestConnection_v1'
}

export enum SecurityMode {
    Lowest = 'Lowest',
    Best = 'Best'
}

export enum EndpointCredentialType {
    Anonymous = 'Anonymous',
    Username = 'Username'
}

export interface EndpointCredentials {
    CredentialType: EndpointCredentialType;
    Username: string;
    Password: string;
}

export interface Endpoint {
    Uri: string;
    SecurityMode: SecurityMode;
    Credentials: EndpointCredentials;
}

export interface IBrowseNodesRequestParams {
    StartNode: string;
    Depth: number;
    RequestedAttributes: string;
}
