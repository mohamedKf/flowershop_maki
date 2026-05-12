import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

const STORAGE_KEY = 'maki_theme';

function getInitialTheme(): Theme {
  // 1. User explicit choice from past visits — always wins
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  }
  // 2. Default to dark — the cinematic theme is the brand
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  // Apply class to <html> so CSS can target [data-theme]
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Update meta theme-color for mobile browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#000000' : '#fbf6f2');
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be inside ThemeProvider');
  return v;
}
