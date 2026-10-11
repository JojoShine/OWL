import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

const lint = new ESLint();

it.each([
  'export const load = () => fetch("/api/example");',
  'export const load = () => window.fetch("/api/example");',
  'export const load = () => new XMLHttpRequest();',
  'export const load = () => new window.XMLHttpRequest();',
  'import axios from "axios"; export const load = () => axios.get("/api/example");',
  'import client from "@/lib/utils/http-client"; export const load = () => client.get("/example");',
  'import { httpClient } from "@/lib/utils"; export const load = () => httpClient.get("/example");',
  'import { createHttpClient } from "@/lib/utils/create-http-client"; export const client = createHttpClient();',
])('rejects business requests that bypass the API layer: %s', async code => {
  const [result] = await lint.lintText(code, { filePath: 'src/components/Example.jsx' });
  expect(result.messages.some(message => message.ruleId?.startsWith('no-restricted-'))).toBe(true);
});

it('rejects raw Axios in API modules as well', async () => {
  const [result] = await lint.lintText('import axios from "axios"; export const load = () => axios.get("/example");', { filePath: 'src/lib/api/system/example.api.js' });
  expect(result.messages.some(message => message.ruleId === 'no-restricted-imports')).toBe(true);
});

it('allows the API URL helper while blocking client creation in API modules', async () => {
  const filePath = 'src/lib/api/system/example.api.js';
  const [helper] = await lint.lintText('import { resolveApiBaseUrl } from "@/lib/utils/create-http-client"; export const url = () => resolveApiBaseUrl("system");', { filePath });
  const [factory] = await lint.lintText('import { createHttpClient } from "@/lib/utils/create-http-client"; export const client = createHttpClient();', { filePath });
  expect(helper.errorCount).toBe(0);
  expect(factory.messages.some(message => message.ruleId === 'no-restricted-imports')).toBe(true);
});

it('allows API modules to use the shared client and pages to call API modules', async () => {
  const [api] = await lint.lintText('import client from "../../utils/http-client"; export const load = () => client.get("/example");', { filePath: 'src/lib/api/system/example.api.js' });
  const [page] = await lint.lintText('import { userApi } from "@/lib/api"; export const load = () => userApi.getUsers();', { filePath: 'src/pages/example/index.jsx' });
  expect(api.errorCount).toBe(0);
  expect(page.errorCount).toBe(0);
});
