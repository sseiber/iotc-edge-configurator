import { IIotcMethodResponse, requestHelper } from './requestHelper';

const subdomain = 'scotts-miab2';
const baseDomain = 'azureiotcentral.com';
const deviceId = 'iiotAdapterDevice';
const moduleName = 'ompadapter';
const componentName = 'com_azureiot_ompadapter_IIoTAdapterInterface';

export async function iiotAdapterRequest(commandName: string, request: any, connectionTimeout = 30, responseTimeout = 30): Promise<IIotcMethodResponse> {
    return requestHelper({
        method: 'post',
        url: `https://${subdomain}.${baseDomain}/api/devices/${deviceId}/modules/${moduleName}/components/${componentName}/commands/${commandName}?api-version=preview`,
        data: {
            connectionTimeout,
            responseTimeout,
            request
        }
    });
}
