import { ExpressAdapter } from '@nestjs/platform-express';

// The HTTP host uses Express 4 to preserve existing query validation. Nest 11 validates
// Express 5 wildcard syntax, so translate only after Nest validates the path.
export class CompatibleExpressAdapter extends ExpressAdapter {
  normalizePath(path: string): string {
    return super.normalizePath(path).replace(/\/\*([A-Za-z][A-Za-z0-9_]*)/g, '/:$1(*)');
  }
}
