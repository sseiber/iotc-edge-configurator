import { makeAutoObservable, runInAction } from 'mobx';

import {
    iiotAdapterRequest
} from '../apis/iiotAdapter';

export enum SecurityMode {
    'Lowest',
    'Best'
}

export enum EndpointCredentialType {
    'Anonymous',
    'Username'
}

export interface EndpointCredentials {
    CredentialType: EndpointCredentialType;
    Username: string;
    Password: string;
}

export interface OpcEndpoint {
    Uri: string;
    SecurityMode: SecurityMode;
    Credentials: {
        CredentialType: EndpointCredentialType;
    };
}

export const emptyOpcCredential = {
    Uri: '',
    SecurityMode: SecurityMode.Lowest,
    Credentials: {
        CredentialType: EndpointCredentialType.Anonymous
    }
};

export interface OpcWriteNode {
    NodeId: string;
    DataValue: OpcDataValue;
}

export interface OpcDataValue {
    Status: string;
    Value: any;
    SourceTimestamp: Date;
    ServerTimestamp: Date;
}

export interface OpcReadNode {
    NodeId: string;
    DataValue: OpcDataValue;
}

export interface ReadValuesRequest {
    Endpoint: OpcEndpoint;
    OpcReadNodes: OpcReadNode[];
}

export enum DeviceCredentialType {
    'X509Certificate',
    'SymmetricKey'
}

export interface DeviceCredentials {
    Type: DeviceCredentialType;
    X509Certificate: Uint8Array;
    PrimaryKey: string;
    SecondaryKey: string;
    IdScope: string;
}

export interface NodeSubscriptionConfiguration {
    NodeId: string;
    DisplayName: string;
    PublishingIntervalMilliseconds: number;
    SamplingIntervalMilliseconds: number;
}

export interface Asset {
    AssetId: string;
    LastChanged: Date;
    IoTHubMessageProperties: Record<string, string>;
    PublishingIntervalMilliseconds: number;
    SamplingIntervalMilliseconds: number;
    OpcEndpoint: OpcEndpoint;
    Nodes: NodeSubscriptionConfiguration[];
    DeviceCredentials: DeviceCredentials;
}

export interface IBrowseNodesRequestParams {
    startNode: string;
    depth: number;
    requestedAttributes: string;
}

export interface IWriteNodesRequestParams {
    nodeId: string;
    value: any;
}

export interface IReadNodesRequestParams {
    nodeId: string;
}

export interface IAddOrUpdateAssetsRequestParams {
    assetId: string;
    publishingInterval: number;
    samplingInterval: number;
    nodes: NodeSubscriptionConfiguration[];
}

export enum IiotAdapterCommands {
    AddOrUpdateAssets_v1 = 'AddOrUpdateAssets_v1',
    GetAllAssets_v1 = 'GetAllAssets_v1',
    RemoveAssets_v1 = 'RemoveAssets_v1',
    Shutdown_v1 = 'Shutdown_v1',
    GenerateDtdl_v1 = 'GenerateDtdl_v1',
    TestConnection_v1 = 'TestConnection_v1',
    WriteValues_v1 = 'WriteValues_v1',
    ReadValues_v1 = 'ReadValues_v1',
    BrowseNodes_v1 = 'BrowseNodes_v1',
    FetchBrowsedNodes_v1 = 'FetchBrowsedNodes_v1'
}

export class IiotAdapterStore {
    constructor() {
        makeAutoObservable(this);
    }

    public connection = false;
    public serviceError = '';

    public async iotcRequest(command: IiotAdapterCommands, params?: any): Promise<void> {
        try {
            switch (command) {
                case IiotAdapterCommands.TestConnection_v1: {
                    const response = await iiotAdapterRequest(command, params, 10, 10);
                    const responsePayload = response.payload;
                    if (responsePayload && responsePayload.status === 200) {
                        runInAction(() => {
                            this.connection = true;
                        });
                    }
                    else {
                        runInAction(() => {
                            this.serviceError = responsePayload.statusMessage || response.message;
                        });
                    }

                    break;
                }
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An error occurred while attempting to get the currenet user session: ${ex.message}`;
            });
        }
    }
}
