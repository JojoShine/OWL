import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'out/**', 'build/**'] },
  {
    files: ['**/*.{js,jsx}'],
    ...react.configs.flat.recommended,
    languageOptions: { ...react.configs.flat.recommended.languageOptions, ecmaVersion: 'latest', sourceType: 'module' },
    plugins: { react, 'react-hooks': hooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...hooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['**/*.test.*'],
    rules: {
      'no-restricted-globals': ['error',
        { name: 'fetch', message: '业务请求请通过 lib/api 使用统一请求客户端。' },
        { name: 'XMLHttpRequest', message: '业务请求请通过 lib/api 使用统一请求客户端。' },
      ],
      'no-restricted-syntax': ['error', {
        selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name="fetch"]',
        message: '业务请求请通过 lib/api 使用统一请求客户端。',
      }, {
        selector: 'NewExpression[callee.type="MemberExpression"][callee.property.name="XMLHttpRequest"]',
        message: '业务请求请通过 lib/api 使用统一请求客户端。',
      }],
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'axios', message: '只能在 create-http-client 中创建请求客户端。' },
          { name: '@/lib/utils', importNames: ['httpClient'], message: '页面和组件请调用 lib/api。' },
          { name: '@/lib/utils/index', importNames: ['httpClient'], message: '页面和组件请调用 lib/api。' },
        ],
        patterns: [{
          group: ['http-client', 'module-client', 'public-client', 'create-http-client'].flatMap(name => [
            `@/lib/utils/${name}`, `@/lib/utils/${name}.js`, `**/utils/${name}`, `**/utils/${name}.js`,
          ]),
          message: '页面和组件请调用 lib/api，不直接调用请求客户端。',
        }, {
          group: ['**/lib/utils', '**/lib/utils/index', '**/lib/utils/index.js'],
          importNames: ['httpClient'],
          message: '页面和组件请调用 lib/api。',
        }],
      }],
    },
  },
  {
    files: ['src/lib/api/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'axios', message: 'API 模块必须使用统一请求客户端。' }],
        patterns: [{
          group: ['@/lib/utils/create-http-client', '@/lib/utils/create-http-client.js', '**/utils/create-http-client', '**/utils/create-http-client.js'],
          importNames: ['createHttpClient'],
          message: 'API 模块必须使用现有统一请求客户端。',
        }],
      }],
    },
  },
  {
    files: ['src/lib/utils/{http-client,module-client,public-client}.js'],
    rules: { 'no-restricted-imports': ['error', { paths: [{ name: 'axios', message: '只能在 create-http-client 中创建请求客户端。' }] }] },
  },
  { files: ['src/lib/utils/create-http-client.js'], rules: { 'no-restricted-imports': 'off' } },
];
