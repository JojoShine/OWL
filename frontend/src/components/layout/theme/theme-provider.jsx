import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);
const validTheme = (value) => ['light', 'dark', 'system'].includes(value);

export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, updateTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return validTheme(saved) ? saved : defaultTheme;
    } catch { return defaultTheme; }
  });
  const [systemTheme, setSystemTheme] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemTheme(query.matches ? 'dark' : 'light');
    const onStorage = (event) => {
      if (event.key === 'theme') updateTheme(validTheme(event.newValue) ? event.newValue : defaultTheme);
    };
    query.addEventListener('change', sync);
    window.addEventListener('storage', onStorage);
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [defaultTheme]);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.classList.toggle('light', resolvedTheme === 'light');
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);
  const setTheme = (value) => {
    if (!validTheme(value)) return;
    updateTheme(value);
    try { localStorage.setItem('theme', value); } catch { /* In-memory preference remains usable. */ }
  };
  return <ThemeContext.Provider value={{ theme, resolvedTheme, systemTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
