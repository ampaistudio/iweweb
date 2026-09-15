import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type FontScale = "normal" | "large" | "xlarge";
export type LanguageCode = "es" | "ca" | "en" | "fr" | "de" | "zh";

export const languages: { code: LanguageCode; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
];

type PreferencesContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  fontScale: FontScale;
  cycleFontScale: () => void;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const THEME_KEY = "iwe-theme";
const FONT_SCALE_KEY = "iwe-font-scale";
const LANGUAGE_KEY = "iwe-language";

const fontScaleOrder: FontScale[] = ["normal", "large", "xlarge"];

function readStored<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStored(THEME_KEY, "light", ["light", "dark"] as const));
  const [fontScale, setFontScale] = useState<FontScale>(() =>
    readStored(FONT_SCALE_KEY, "normal", fontScaleOrder as readonly FontScale[]),
  );
  const [language, setLanguage] = useState<LanguageCode>(() =>
    readStored(
      LANGUAGE_KEY,
      "es",
      languages.map((entry) => entry.code),
    ),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage no disponible; la preferencia no persiste entre sesiones
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    try {
      window.localStorage.setItem(FONT_SCALE_KEY, fontScale);
    } catch {
      // localStorage no disponible; la preferencia no persiste entre sesiones
    }
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // localStorage no disponible; la preferencia no persiste entre sesiones
    }
  }, [language]);

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  const cycleFontScale = () =>
    setFontScale((current) => {
      const nextIndex = (fontScaleOrder.indexOf(current) + 1) % fontScaleOrder.length;
      return fontScaleOrder[nextIndex];
    });

  return (
    <PreferencesContext.Provider value={{ theme, toggleTheme, fontScale, cycleFontScale, language, setLanguage }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  }
  return context;
}
