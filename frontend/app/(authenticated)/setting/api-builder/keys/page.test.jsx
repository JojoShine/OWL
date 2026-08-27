import fs from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('API key date picker contract', () => {
  it('uses the system DatePicker instead of a native date input', () => {
    const source = fs.readFileSync(
      resolve(process.cwd(), 'app/(authenticated)/setting/api-builder/keys/page.js'),
      'utf8'
    );
    expect(source).toContain("import { DatePicker } from '@/components/ui/date-picker'");
    expect(source).toContain('placeholder="选择有效期（可选）"');
    expect(source).not.toContain('type="date"');
  });
});
