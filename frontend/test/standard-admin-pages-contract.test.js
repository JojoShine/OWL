import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const standardPages = [
  'src/pages/setting/users/index.jsx',
  'src/pages/setting/roles/index.jsx',
  'src/pages/setting/permissions/index.jsx',
  'src/pages/setting/departments/index.jsx',
  'src/pages/setting/menus/index.jsx',
  'src/pages/setting/sensitive-fields/index.jsx',
  'src/pages/setting/third-party-keys/index.jsx',
  'src/pages/setting/email-templates/index.jsx',
  'src/pages/setting/api-builder/keys/index.jsx',
];

const standardDialogs = [
  'src/components/roles/role-form-dialog.jsx',
  'src/components/departments/department-form-dialog.jsx',
  'src/components/menus/menu-form-dialog.jsx',
  'src/components/sensitive-fields/sensitive-field-form-dialog.jsx',
  'src/components/third-party-keys/key-form-dialog.jsx',
  'src/components/notification/EmailTemplateFormDialog.jsx',
  'src/pages/user-auth/UserAuthDialog.js',
  'src/pages/setting/api-builder/keys/index.jsx',
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
