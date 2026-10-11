jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../src/shared/http/requestLogger', () => ({
  accessLogMiddleware: (req, res, next) => next(),
  operationLogMiddleware: (req, res, next) => next(),
}));

const { createHttpApp } = require('../../src/shared/http/app');
const { IncomingMessage, ServerResponse } = require('node:http');
const { Socket } = require('node:net');

it('exposes the rate-limit wait time to cross-origin browsers', async () => {
  const app = createHttpApp({ maskingMiddleware: (req, res, next) => next() });
  app.get('/api/test', (req, res) => res.send('ok'));
  const socket = new Socket();
  Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
  const request = new IncomingMessage(socket);
  request.method = 'GET';
  request.url = '/api/test';
  request.headers = { origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0] };
  const response = new ServerResponse(request);
  await new Promise(resolve => {
    response.end = resolve;
    app.handle(request, response);
  });
  expect(response.statusCode).toBe(200);
  expect(response.getHeader('Access-Control-Expose-Headers')).toBe('Retry-After');
});
