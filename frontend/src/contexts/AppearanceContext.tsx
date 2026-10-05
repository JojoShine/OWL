
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { getStorageKey } from '@/lib/utils/storage-key';
import { isSceneTheme, resolveSceneTheme, type SceneTheme } from '@/lib/theme/preferences';

type Appearance = {
  sceneTheme: SceneTheme;
  mounted: boolean;
  isPersonal: boolean;
  setSceneTheme: (scene: SceneTheme) => void;
  setProjectDefault: (scene: string | null) => void;
  resetSceneTheme: () => void;
};
const AppearanceContext = createContext<Appearance | null>(null);
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function preferenceKey() {
  try { return getStorageKey('appearance-scene'); } catch { return null; }
}

export function AppearanceProvider({ children, projectDefault = import.meta.env.VITE_APP_SCENE || 'general' }: {
  children: ReactNode;
  projectDefault?: string;
}) {
  const [personal, setPersonal] = useState<SceneTheme | null>(null);
  const [project, setProject] = useState<string | null>(projectDefault);
  const [mounted, setMounted] = useState(false);

  useClientLayoutEffect(() => {
    try {
      const key = preferenceKey();
      const value = key ? localStorage.getItem(key) : null;
      setPersonal(isSceneTheme(value) ? value : null);
    } catch { /* Storage may be unavailable; the in-memory preference still works. */ }
    setMounted(true);
  }, []);

  useEffect(() => setProject(projectDefault), [projectDefault]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      const key = preferenceKey();
      if (key && (event.key === key || event.key === null)) {
        setPersonal(isSceneTheme(event.newValue) ? event.newValue : null);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const setSceneTheme = useCallback((scene: SceneTheme) => {
    if (!isSceneTheme(scene)) return;
    setPersonal(scene);
    try { const key = preferenceKey(); if (key) localStorage.setItem(key, scene); } catch { /* Keep the current session usable. */ }
  }, []);
  const resetSceneTheme = useCallback(() => {
    setPersonal(null);
    try { const key = preferenceKey(); if (key) localStorage.removeItem(key); } catch { /* Keep the current session usable. */ }
  }, []);
  const sceneTheme = resolveSceneTheme(personal, project);
  const value = useMemo(() => ({ sceneTheme, mounted, isPersonal: personal !== null, setSceneTheme, setProjectDefault: setProject, resetSceneTheme }), [sceneTheme, mounted, personal, setSceneTheme, resetSceneTheme]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}
