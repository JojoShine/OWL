import './environment';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { CompatibleExpressAdapter } from './compatibility/express.adapter';
import { AppModule } from './app.module';
import { CompatibleExceptionFilter } from './compatibility/exception.filter';
import { MaskingService } from './data-security/masking.service';
import { shared } from './compatibility/shared';
import express from 'express';

export async function createApplication() {
  let masking: MaskingService;
  const http = shared('http/app').createHttpApp({
    maskingMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => masking.middleware(req, res, next),
  });
  const app = await NestFactory.create(AppModule, new CompatibleExpressAdapter(http), { bodyParser: false, abortOnError: false });
  masking = app.get(MaskingService);
  app.useGlobalFilters(new CompatibleExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
