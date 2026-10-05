const PREVIEW_PLATFORM_ID = 'ui-preview';
const PREVIEW_TOKEN_KEY = 'ui-preview__token';
const PREVIEW_USER_KEY = 'ui-preview__user';
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

const previewUser = {
  id: 'preview',
  username: 'preview',
  real_name: 'UI Preview',
  email: 'preview@example.invalid',
  roles: [{ name: '超级管理员', code: 'super_admin' }],
  department: { name: '平台研发部' },
};

export function syncUiPreviewAuth({ storage, nodeEnv, previewEnabled, hostname }) {
  const isEnabled =
    nodeEnv !== 'production' &&
    previewEnabled === 'true' &&
    LOOPBACK_HOSTNAMES.has(hostname);

  if (isEnabled) {
    storage.setItem('__platform_id', PREVIEW_PLATFORM_ID);
    storage.setItem(PREVIEW_TOKEN_KEY, 'preview-only');
    storage.setItem(PREVIEW_USER_KEY, JSON.stringify(previewUser));
    return true;
  }

  if (storage.getItem('__platform_id') === PREVIEW_PLATFORM_ID) {
    storage.removeItem(PREVIEW_TOKEN_KEY);
    storage.removeItem(PREVIEW_USER_KEY);
    storage.removeItem('__platform_id');
  }

  return false;
}
