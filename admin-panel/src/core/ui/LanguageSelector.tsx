import React from 'react';
import type { DashboardLocale } from '../../api/types';

export interface LanguageOption {
  code: DashboardLocale;
  label: string;
  flag: string;
  isDefault?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸', isDefault: true },
  { code: 'ca', label: 'Català', flag: '🇦🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export interface LanguageTabsProps {
  activeLocale: DashboardLocale;
  onChangeLocale: (locale: DashboardLocale) => void;
  hasTranslation?: (locale: DashboardLocale) => boolean;
  className?: string;
}

export const LanguageTabs: React.FC<LanguageTabsProps> = ({
  activeLocale,
  onChangeLocale,
  hasTranslation,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-bg border border-border rounded-2xl ${className}`}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = activeLocale === lang.code;
        const translated = hasTranslation ? hasTranslation(lang.code) : true;

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChangeLocale(lang.code)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
              isActive
                ? 'bg-accent text-accent-text shadow-sm'
                : 'bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary border border-border/80'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {lang.isDefault && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-bg/20 text-accent-text' : 'bg-surface text-muted'}`}>
                Base
              </span>
            )}
            {!lang.isDefault && (
              <span
                className={`w-2 h-2 rounded-full ${
                  translated ? (isActive ? 'bg-bg/40' : 'bg-accent') : 'bg-muted/40'
                }`}
                title={translated ? 'Traducción existente' : 'Sin traducir'}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
