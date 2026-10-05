import { resolve } from 'node:path';
// Shared JavaScript helpers are compiled alongside Nest into dist/shared.
export const shared = (file: string): any => require(resolve(__dirname, '../../shared', file));
