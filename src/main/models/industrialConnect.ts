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
    CredentialType: EndpointCredentialType;
    Username: string;
    Password: string;
}

export interface IEndpoint {
    Uri: string;
    SecurityMode: SecurityMode;
    Credentials: IEndpointCredentials;
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
    OpcEndpoint: IEndpoint;
    StartNode: string;
    Depth: number;
    RequestedNodeClasses: OpcNodeClass[];
    RequestedAttributes: OpcAttribute[];
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

export interface IDeviceConfiguration {
    testConnection: ITestConnectionConfig;
    browseNodes: IBrowseNodesConfig;
}

export interface IAdapterConfiguration {
    appId: string;
    deviceId: string;
    deviceConfig: IDeviceConfiguration;
}

export interface IBrowseNodesResponse {
    JobId: string;
}
