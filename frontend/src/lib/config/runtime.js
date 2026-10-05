// Vite's base is the single source for router, public assets and same-origin endpoints.
export const getBasePath = () => (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const getApiRoot = () => (import.meta.env.VITE_API_URL || `${getBasePath()}/api`).replace(/\/$/, '').replace(/\/system$/, '');
export const getBackendBaseUrl = () => import.meta.env.VITE_BASE_URL || getApiRoot().replace(/\/api$/, '');
export const getSocketPath = () => `${getBasePath()}/socket.io/`;
