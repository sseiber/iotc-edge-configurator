import axios from 'axios';
import logger from '../logger';

const ModuleName = 'requestApi';

export async function requestApi(config: any): Promise<any> {
    logger.log([ModuleName, 'info'], `requestApi: (${config.method}) - ${config.url}`);

    const response = {
        status: 200,
        message: 'SUCCESS',
        payload: {}
    };

    try {
        const axiosResponse = await axios.request(config);

        response.status = axiosResponse.status;
        response.message = axiosResponse.statusText;

        if (axiosResponse.data) {
            response.payload = axiosResponse.data;
        }
    }
    catch (ex) {
        if (ex.isAxiosError && ex.response) {
            response.status = ex.response.status;
            response.message = `An error occurred during the request: ${ex.response.status}`;
        }
        else {
            response.status = 500;
            response.message = `An error occurred during the request: ${ex.message}`;
        }
    }

    return response;
}
