import { Injectable } from '@nestjs/common';
import { shared } from '../compatibility/shared';
// Log storage is file-based; reuse the existing reader and export formats.
@Injectable()
export class LogService extends shared('log/log-reader').constructor {
}
