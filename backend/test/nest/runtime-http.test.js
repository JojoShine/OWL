const { Test } = require('@nestjs/testing');
const { ApiController } = require('../../dist/nest/api.controller');
const { CompatibleExpressAdapter } = require('../../dist/nest/compatibility/express.adapter');
const { CompatibleExceptionFilter } = require('../../dist/nest/compatibility/exception.filter');
const express = require('express');
let app, base;
beforeAll(async () => {
  const module = await Test.createTestingModule({ controllers: [ApiController] }).compile();
  app = module.createNestApplication(new CompatibleExpressAdapter(express()), { bodyParser: false });
  app.useGlobalFilters(new CompatibleExceptionFilter());
  await app.listen(0, '127.0.0.1'); base = await app.getUrl();
});
afterAll(() => app?.close());
it('preserves the public API index', async () => {
  const response = await fetch(base + '/api');
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, version: '1.0.0', endpoints: { health: 'GET /health' } });
});
it('preserves unknown-route errors after removing the legacy router', async () => {
  const response = await fetch(base + '/api/biz/missing?x=1');
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, message: 'Route not found - /api/biz/missing?x=1' });
});
