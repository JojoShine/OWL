import { fileURLToPath, URL } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'users-page-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.endsWith('/app/(authenticated)/setting/users/page.js')) return null;
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
