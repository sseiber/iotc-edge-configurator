// import { makeAutoObservable, runInAction } from 'mobx';
// FIX: xxx
const runInAction = (func: any) => {
    return func();
};

import {
    iiotAdapterRequest
} from '../apis/iiotAdapter';

// @ts-ignore
const genericError = `Sorry, an unknown error occurred, try again after rebooting your device`;

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

export enum iiotAdapterCommand {
    cmBrowseNodes,
    cmFetchNodes
}

export class IiotAdapterStore {
    // FIX: xxx
    // constructor() {
    //     makeAutoObservable(this);
    // }

    public serviceError = '';

    // FIX: xxx
    // @ts-ignore
    public async iotcRequest(command: iiotAdapterCommand, params?: any): Promise<void> {
        try {
            switch (command) {
                case iiotAdapterCommand.cmBrowseNodes: {
                    const response = await iiotAdapterRequest('foo', 'bar');
                    const responsePayload = response.payload;
                    if (responsePayload && responsePayload.status === 200) {
                        runInAction(() => {
                            // FIX: xxx
                            // @ts-ignore
                            const foo = responsePayload.payload || [];
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
