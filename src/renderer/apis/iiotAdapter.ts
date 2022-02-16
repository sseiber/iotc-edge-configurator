import { IIotcMethodResponse, requestHelper } from './requestHelper';

// @ts-ignore
const subdomain = 'iiotadapterpoc';
// @ts-ignore
const baseDomain = 'azure.iotcentral.com';
const deviceId = 'iiotAdapterDevice';
const moduleName = 'ompadapter';

export async function iiotAdapterRequest(commandName: string, request: any, connectionTimeout = 30, responseTimeout = 30): Promise<IIotcMethodResponse> {
    return requestHelper({
        method: 'post',
        url: `/api/devices/${deviceId}/modules/${moduleName}/commands/${commandName}?api-version=1.0`,
        data: {
            connectionTimeout,
            responseTimeout,
            request
        }
    });
}
