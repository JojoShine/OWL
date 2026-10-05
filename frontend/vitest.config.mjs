import { fileURLToPath, URL } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [
    {
      name: 'project-jsx-in-js',
      enforce: 'pre',
      async transform(code, id) {
        const cleanId = id.split('?')[0];
        if (
          !cleanId.startsWith(projectRoot)
          || !cleanId.endsWith('.js')
          || cleanId.includes('/node_modules/')
        ) return null;
        return transformWithEsbuild(code, cleanId, { loader: 'jsx', jsx: 'automatic' });
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    clearMocks: true,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
});
