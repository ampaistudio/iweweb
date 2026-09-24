import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type FontScale = 'small' | 'normal' | 'large';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'iwe-dashboard-theme';
const FONT_SCALE_STORAGE_KEY = 'iwe-dashboard-font-scale';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function getInitialFontScale(): FontScale {
  if (typeof window === 'undefined') return 'normal';
  try {
    const stored = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (stored === 'small' || stored === 'normal' || stored === 'large') {
      return stored;
    }
    return 'normal';
  } catch {
    return 'normal';
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [fontScale, setFontScaleState] = useState<FontScale>(getInitialFontScale);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const applyFontScale = (scale: FontScale) => {
    document.documentElement.setAttribute('data-font-scale', scale);
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  useEffect(() => {
    applyFontScale(fontScale);
    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale);
    } catch {
      // localStorage unavailable
    }
  }, [fontScale]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFontScale = (newScale: FontScale) => {
    setFontScaleState(newScale);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Alias for semantic clarity
export const usePreferences = useTheme;
