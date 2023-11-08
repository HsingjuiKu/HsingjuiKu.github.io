const developmentBaseUrl = '/api/';
const productionBaseUrl = '/api/';


export const BASE_URL = process.env.NODE_ENV === 'development' ? developmentBaseUrl : productionBaseUrl;
export const TIMEOUT = 15000;
