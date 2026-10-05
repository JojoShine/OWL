import { describe, expect, it } from 'vitest';
import { resolveSceneTheme } from './preferences';

describe('scene preference resolution', () => {
  it('keeps an explicit personal scene ahead of the project default', () => {
    expect(resolveSceneTheme('general', 'government-service')).toBe('general');
  });
  it('uses the project scene when there is no valid personal preference', () => {
    expect(resolveSceneTheme(null, 'government-service')).toBe('government-service');
    expect(resolveSceneTheme('party-government', 'government-service')).toBe('government-service');
  });
  it('does not infer a business scene from old colors', () => {
    expect(resolveSceneTheme('red', 'blue')).toBe('general');
    expect(resolveSceneTheme('invalid', 'invalid')).toBe('general');
  });
});
