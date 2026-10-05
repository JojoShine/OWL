import { useLayoutEffect } from 'react';
import { App } from 'antd';

let messageApi;
let notificationApi;
let sequence = 0;
const pending = [];
const run = (action) => messageApi ? action() : pending.push(action);

function show(type, content, options = {}) {
  const key = options.id ?? `owl-message-${++sequence}`;
  run(() => {
    if (options.description) {
      notificationApi.open({ type, title: content, description: options.description, key, duration: (options.duration ?? 4500) / 1000 });
    } else {
      messageApi.open({ type, content, key, duration: type === 'loading' ? 0 : (options.duration ?? 3000) / 1000 });
    }
  });
  return key;
}

export const toast = Object.fromEntries(['success', 'error', 'warning', 'info', 'loading'].map((type) => [type, (content, options) => show(type, content, options)]));
toast.dismiss = (key) => run(() => { messageApi.destroy(key); notificationApi.destroy(key); });

export function ToastProvider({ children }) {
  const { message, notification } = App.useApp();
  useLayoutEffect(() => {
    messageApi = message;
    notificationApi = notification;
    pending.splice(0).forEach((action) => action());
    return () => { messageApi = undefined; notificationApi = undefined; };
  }, [message, notification]);
  return children;
}
