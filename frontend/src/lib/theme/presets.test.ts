import { describe, expect, it } from 'vitest';
import { theme } from 'antd';
import { sceneTokens, SCENE_THEMES } from './presets';

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((part) => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

describe('scene selection contrast', () => {
  for (const scene of SCENE_THEMES) for (const dark of [false, true]) {
    it(`${scene.value} ${dark ? 'dark' : 'light'} keeps selected text readable`, () => {
      const tokens = theme.getDesignToken({ ...sceneTokens(scene.value, dark), algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm });
      const levels = [luminance(tokens.colorText), luminance(tokens.controlItemBgActive)].sort((a, b) => b - a);
      expect((levels[0] + 0.05) / (levels[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
      if (!dark) expect(luminance(tokens.controlItemBgActive)).toBeGreaterThan(0.75);
    });
  }
});
