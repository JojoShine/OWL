import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { shared } from './shared';

@Catch()
export class CompatibleExceptionFilter implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const http = host.switchToHttp();
    if (error instanceof HttpException && error.getStatus() === 404 && !http.getRequest().route) {
      error.message = `Route not found - ${http.getRequest().originalUrl}`;
    }
    if (error instanceof HttpException) Object.assign(error, { statusCode: error.getStatus() });
    shared('http/error').errorHandler(error, http.getRequest(), http.getResponse(), () => {});
  }
}
