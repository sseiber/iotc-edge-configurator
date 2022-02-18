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
        credentials: 'include',
        headers: {
            Authorization: 'SharedAccessSignature sr=fe7521f6-5581-4312-8339-f7824b29ad55&sig=jkslK02u3aSAtW7UaUwKkQLZ2ahfEqqLFRexF5wKKwM%3D&skn=iiotAdapterGateway&se=1676153588131'
        },
        data: {
            connectionTimeout,
            responseTimeout,
            request
        }
    });
}
