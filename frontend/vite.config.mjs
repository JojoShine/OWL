import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { forwardLocalOrigin } from './tooling/dev-proxy.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = `/${(env.VITE_BASE_PATH ?? (mode === 'production' ? '/owl' : '')).replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') + '/';
  const prefix = base.replace(/\/$/, '');
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3001';
  return {
    base,
    plugins: [{
      name: 'owl-jsx-in-js', enforce: 'pre',
      async transform(code, id) {
        const cleanId = id.split('?')[0];
        if (!cleanId.includes('/node_modules/') && cleanId.endsWith('.js')) {
          return transformWithEsbuild(code, cleanId, { loader: 'jsx', jsx: 'automatic' });
        }
      },
    }, react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src/', import.meta.url)) } },
    optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
    server: { host: '127.0.0.1', proxy: Object.fromEntries(['api', 'socket.io', 'uploads'].map((path) => [
      `${prefix}/${path}`, {
        target, changeOrigin: true, ws: path === 'socket.io', rewrite: (path) => path.slice(prefix.length),
        configure(proxy) {
          proxy.on('proxyReq', forwardLocalOrigin);
          proxy.on('proxyReqWs', forwardLocalOrigin);
        },
      },
    ])) },
    preview: { host: '127.0.0.1' },
    build: { outDir: 'dist' },
  };
});
