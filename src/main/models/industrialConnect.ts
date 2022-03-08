export enum IndustrialConnectCommands {
    TestConnection = 'TestConnection_v1',
    BrowseNodes = 'BrowseNodes_v1'
}

export enum SecurityMode {
    Lowest,
    Best
}

export enum EndpointCredentialType {
    Anonymous,
    Username
}

export interface IEndpointCredentials {
    credentialType: EndpointCredentialType;
    username: string;
    password: string;
}

export interface IEndpoint {
    uri: string;
    securityMode: SecurityMode;
    credentials: IEndpointCredentials;
}

export enum OpcNodeClass {
    Object = 1,
    Variable = 2,
}

export enum OpcAttribute {
    NodeClass = 2,
    BrowseName = 3,
    DisplayName = 4,
    Description = 5,
    Value = 13,
    DataType = 14,
    ValueRank = 15,
    ArrayDimensions = 16,
    UserAccessLevel = 18,
}

export interface IBrowseNodesRequest {
    opcEndpoint: IEndpoint;
    startNode: string;
    depth: number;
    requestedNodeClasses: OpcNodeClass[];
    requestedAttributes: OpcAttribute[];
}

export interface ITestConnectionConfig {
    opcEndpointUri: string;
    securityMode: SecurityMode;
    credentials: IEndpointCredentials;
}

export interface IBrowseNodesConfig {
    startNode: string;
    depth: number;
    requestedNodeClasses: OpcNodeClass[];
    requestedAttributes: OpcAttribute[];
}

export interface IAdapterConfiguration {
    appId: string;
    deviceId: string;
    testConnection: ITestConnectionConfig;
    browseNodes: IBrowseNodesConfig;
}

export const emptyAdapterConfig: IAdapterConfiguration = {
    appId: '',
    deviceId: '',
    testConnection: {
        opcEndpointUri: '',
        securityMode: SecurityMode.Lowest,
        credentials: {
            credentialType: EndpointCredentialType.Anonymous,
            username: '',
            password: ''
        }
    },
    browseNodes: {
        startNode: '',
        depth: 1,
        requestedNodeClasses: [OpcNodeClass.Object, OpcNodeClass.Variable],
        requestedAttributes: [OpcAttribute.DisplayName, OpcAttribute.BrowseName]
    }
};

export interface IBrowseNodesResponse {
    jobId: string;
}
