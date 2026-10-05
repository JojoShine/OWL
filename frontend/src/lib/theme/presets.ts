import type { ThemeConfig } from 'antd';
import type { SceneTheme } from './preferences';

export const SCENE_THEMES = [
  { value: 'general', label: '通用', description: '简洁中性，专注内容', color: '#25282d', darkColor: '#f4f4f5', selection: '#eef0f3', darkSelection: '#34343a', focus: 'rgba(37, 40, 45, 0.12)', darkFocus: 'rgba(244, 244, 245, 0.16)', legacy: 'default' },
  { value: 'government-service', label: '政务', description: '清晰有序，蓝色主调', color: '#1677d2', darkColor: '#8db9ee', selection: '#edf3fc', darkSelection: '#25364b', focus: 'rgba(22, 119, 210, 0.12)', darkFocus: 'rgba(141, 185, 238, 0.16)', legacy: 'blue' },
] as const;

export function sceneTokens(scene: SceneTheme, dark: boolean): ThemeConfig {
  const preset = SCENE_THEMES.find((item) => item.value === scene)!;
  return {
    token: {
      colorPrimary: dark ? preset.darkColor : preset.color,
      controlItemBgActive: dark ? preset.darkSelection : preset.selection,
      controlItemBgActiveHover: dark ? preset.darkSelection : preset.selection,
      controlOutline: dark ? preset.darkFocus : preset.focus,
      colorLink: dark ? preset.darkColor : preset.color,
      colorTextLightSolid: dark ? '#18181b' : '#ffffff',
      colorBgBase: dark ? '#18181b' : '#ffffff',
      colorBgContainer: dark ? '#18181b' : '#ffffff',
      colorBgElevated: dark ? '#202023' : '#ffffff',
      colorBgLayout: dark ? '#0b0b0c' : '#f5f6f8',
      colorText: dark ? '#f1f1f2' : '#1f2328',
      colorTextSecondary: dark ? '#a1a1aa' : '#69707a',
      colorBorder: dark ? '#3b3b42' : '#d4d7dc',
      colorBorderSecondary: dark ? '#2e2e33' : '#e3e5e8',
      colorError: dark ? '#fb7185' : '#d92d20',
      colorSuccess: dark ? '#71c9a5' : '#16805b',
      colorWarning: dark ? '#e3b775' : '#a56b16',
      fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: 14,
      borderRadius: 6,
      controlHeight: 36,
      controlOutlineWidth: 2,
      motionDurationFast: '0.12s',
      motionDurationMid: '0.18s',
      motionDurationSlow: '0.24s',
    },
    components: {
      Input: { activeShadow: 'none', errorActiveShadow: 'none', warningActiveShadow: 'none' },
      Button: { primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none', fontWeight: 500 },
      Table: { headerBg: dark ? '#202023' : '#f7f8fa', headerColor: dark ? '#b6b6bd' : '#69707a', headerSplitColor: 'transparent', cellPaddingBlockSM: 10, cellPaddingInlineSM: 16, rowHoverBg: dark ? '#222225' : '#f7f8fa' },
      Modal: { titleFontSize: 18, titleLineHeight: 1.5 },
      Form: { itemMarginBottom: 16, labelColor: dark ? '#e4e4e7' : '#34383e' },
    },
  };
}
