import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const standardPages = [
  'app/(authenticated)/setting/users/page.js',
  'app/(authenticated)/setting/roles/page.js',
  'app/(authenticated)/setting/permissions/page.js',
  'app/(authenticated)/setting/departments/page.js',
  'app/(authenticated)/setting/menus/page.js',
  'app/(authenticated)/setting/sensitive-fields/page.js',
  'app/(authenticated)/setting/third-party-keys/page.js',
  'app/(authenticated)/setting/email-templates/page.js',
  'app/(authenticated)/setting/api-builder/keys/page.js',
];

const standardDialogs = [
  'components/users/user-form-dialog.jsx',
  'components/roles/role-form-dialog.jsx',
  'components/departments/department-form-dialog.jsx',
  'components/menus/menu-form-dialog.jsx',
  'components/sensitive-fields/sensitive-field-form-dialog.jsx',
  'components/third-party-keys/key-form-dialog.jsx',
  'components/notification/EmailTemplateFormDialog.jsx',
  'app/(authenticated)/user-auth/UserAuthDialog.js',
  'app/(authenticated)/setting/api-builder/keys/page.js',
];

describe('standard admin pages', () => {
  it.each(standardPages)('%s uses the shared admin page hierarchy', (file) => {
    const source = read(file);

    expect(source).toContain("from '@/components/layout/page-shell'");
    expect(source).toContain('<PageShell');
    expect(source).toContain('<PageHeader');
    expect(source).not.toMatch(/bg-(blue|slate|gray)-/);
    expect(source).not.toMatch(/text-(slate|gray)-/);

    if (source.includes('<PageToolbar')) {
      expect(source.indexOf('<PageHeader')).toBeLessThan(source.indexOf('<PageToolbar'));
      expect(source.indexOf('<PageToolbar')).toBeLessThan(source.indexOf('<PageSurface'));
    }
  });

  it.each(standardDialogs)('%s keeps dialog context and actions reachable', (file) => {
    const source = read(file);

    expect(source).toContain('<DialogHeader');
    expect(source).toContain('<DialogTitle');
    expect(source).toContain('<DialogDescription');
    expect(source).toContain('<DialogFooter');
    expect(source).toMatch(/max-h-\[85d?vh\]/);
    expect(source).toMatch(/overflow-y-auto/);
  });
});
