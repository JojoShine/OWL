import { describe, expect, it } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import baseline from '../../../docs/architecture/local-menu-baseline.json';
import { routes } from './routes';

describe('initialized local backend menu routes', () => {
  for (const menu of baseline.menus.filter((item) => item.path && item.status === 'active')) {
    it(`provides the real page for ${menu.name} (${menu.path})`, () => {
      const matches = matchRoutes(routes, menu.path);
      const last = matches?.at(-1);
      expect(last).toBeDefined();
      expect(last.route.path).not.toBe('*');
      expect(last.route.path).not.toBe(':slug');
      expect(`/${last.route.path}`).toBe(menu.path);
      expect(matches.some((match) => match.route.id === 'authenticated')).toBe(true);
    });
  }
});
