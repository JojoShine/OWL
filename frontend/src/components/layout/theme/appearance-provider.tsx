
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { App, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useTheme } from '@/components/layout/theme/theme-provider';
import { AppearanceProvider, useAppearance } from '@/contexts/AppearanceContext';
import { sceneTokens, SCENE_THEMES } from '@/lib/theme/presets';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function ThemeBridge({ children }: { children: ReactNode }) {
  const { sceneTheme } = useAppearance();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useClientLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red', 'theme-cyan');
    const preset = SCENE_THEMES.find((item) => item.value === sceneTheme)!;
    if (preset.legacy !== 'default') root.classList.add(`theme-${preset.legacy}`);
    root.dataset.scene = sceneTheme;
  }, [sceneTheme]);
  const config = useMemo(() => {
    const settings = sceneTokens(sceneTheme, dark);
    return { ...settings, algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm, token: { ...settings.token, motion: !reducedMotion } };
  }, [sceneTheme, dark, reducedMotion]);
  return <ConfigProvider locale={zhCN} theme={config}><App component={false}>{children}</App></ConfigProvider>;
}

export function OwlAppearanceProvider({ children }: { children: ReactNode }) {
  return <AppearanceProvider><ThemeBridge>{children}</ThemeBridge></AppearanceProvider>;
}
