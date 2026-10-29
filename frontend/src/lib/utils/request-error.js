import { safeBusinessMessage, getBusinessErrorMessage } from './business-errors';
function responseMessage(data) {
  return getBusinessErrorMessage(data?.errorCode, data?.params) || safeBusinessMessage(typeof data === 'string' ? data : data?.message);
}

export function getRequestErrorMessage(error, fallback = '操作失败，请稍后重试') {
  if (error?.errorKind === 'cancelled') return '';
  return error?.userMessage || responseMessage(error?.response?.data)
    || (!error?.isAxiosError && safeBusinessMessage(error?.message)) || fallback;
}

export async function normalizeRequestError(error) {
  if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.__CANCEL__) {
    error.errorKind = 'cancelled';
    error.errorHandled = true;
    return error;
  }

  const status = error.response?.status;
  let data = error.response?.data;
  if (typeof data?.text === 'function') {
    try {
      const text = await data.text();
      try { data = JSON.parse(text); } catch { data = text; }
    } catch { data = null; }
  }
  const message = responseMessage(data);
  error.errorKind = status ? 'http' : 'network';
  if (getBusinessErrorMessage(data?.errorCode, data?.params)) {
    error.errorKind = 'business';
    error.userMessage = getBusinessErrorMessage(data.errorCode, data.params);
  } else if (status === 429) {
    error.errorKind = 'rate-limit';
    const headers = error.response.headers;
    const retryAfter = headers?.get?.('Retry-After') ?? headers?.['retry-after'];
    const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) : Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000);
    error.userMessage = '请求过于频繁，请稍后再试。';
    if (Number.isFinite(seconds) && seconds > 0) {
      error.retryAfterSeconds = seconds;
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      const wait = [minutes ? `${minutes} 分` : '', remainder ? `${remainder} 秒` : ''].filter(Boolean).join(' ');
      error.userMessage = `请求过于频繁，请在 ${wait}后重试。`;
    }
  } else if (status >= 500) {
    error.userMessage = '服务器出错，请稍后重试';
  } else if (status === 401) {
    error.userMessage = message || '登录已过期，请重新登录';
  } else if (status === 403) {
    error.userMessage = message || '您没有权限访问此资源';
  } else if (status === 404) {
    error.userMessage = message || '请求的资源不存在';
  } else if (status) {
    error.errorKind = 'business';
    error.userMessage = message || '请求未能完成，请检查输入后重试';
  } else if (['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) {
    error.errorKind = 'timeout';
    error.userMessage = '请求超时，请稍后重试';
  } else {
    error.userMessage = error.request || error.code === 'ERR_NETWORK' ? '网络连接失败，请检查网络' : '请求出错，请稍后重试';
  }
  return error;
}
