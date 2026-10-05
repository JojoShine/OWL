
import { useAppearance } from '@/contexts/AppearanceContext';
import { SCENE_THEMES } from '@/lib/theme/presets';

// Temporary read-only bridge for components not yet migrated to scene themes.
export function useColorTheme() {
  const { sceneTheme, mounted } = useAppearance();
  const preset = SCENE_THEMES.find((scene) => scene.value === sceneTheme);
  return { colorTheme: preset.legacy, mounted };
}
