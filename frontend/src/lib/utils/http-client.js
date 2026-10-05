import { getBasePath } from '@/lib/config/runtime';
import { createHttpClient } from './create-http-client';

const axiosInstance = createHttpClient({ kind: 'system', authenticated: true });

export default axiosInstance;

export { getBackendBaseUrl as getApiBaseUrl } from '@/lib/config/runtime';
export const getStaticResourcePrefix = getBasePath;
