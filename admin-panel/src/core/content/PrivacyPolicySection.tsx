import React from 'react';
import type { DashboardLocale } from '../../api/types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { RichTextEditor } from '../ui/RichTextEditor';
import type { NonEsLocale } from './contentTypes';

interface PrivacyPolicySectionProps {
  form: Record<string, string>;
  activeLocale: DashboardLocale;
  translations: Record<NonEsLocale, Record<string, string>>;
  onChange: (key: string, value: string) => void;
  onTranslationChange: (locale: NonEsLocale, key: string, value: string) => void;
}

export const PrivacyPolicySection: React.FC<PrivacyPolicySectionProps> = ({
  form, activeLocale, translations, onChange, onTranslationChange,
}) => {
  const isEs = activeLocale === 'es';
  const value = isEs ? form.privacy_policy_text || '' : translations[activeLocale]?.privacy_policy_text || '';

  const editorValue = value.trimStart().startsWith('<') ? value : value.split(/\n\s*\n/).map((block) => {
    const lines = block.trim().split('\n');
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!block.trim()) return '';
    if (lines.length === 1 && lines[0].startsWith('## ')) return `<h2>${escape(lines[0].slice(3))}</h2>`;
    if (lines.every((line) => line.startsWith('- '))) return `<ul>${lines.map((line) => `<li><p>${escape(line.slice(2))}</p></li>`).join('')}</ul>`;
    return `<p>${lines.map(escape).join('<br>')}</p>`;
  }).join('');

  const update = (key: string, nextValue: string) => isEs
    ? onChange(key, nextValue)
    : onTranslationChange(activeLocale, key, nextValue);

  return (
    <Card title="Política de protección de datos" subtitle="Texto publicado en /privacidad">
      <div className="space-y-4">
      <Input label="Título de la página" value={isEs ? form.privacy_policy_title || '' : translations[activeLocale]?.privacy_policy_title || ''} onChange={(event) => update('privacy_policy_title', event.target.value)} />
      <Input label="Subtítulo" value={isEs ? form.privacy_policy_eyebrow || '' : translations[activeLocale]?.privacy_policy_eyebrow || ''} onChange={(event) => update('privacy_policy_eyebrow', event.target.value)} />
      <Input label="Descripción SEO" value={isEs ? form.privacy_policy_seo_description || '' : translations[activeLocale]?.privacy_policy_seo_description || ''} onChange={(event) => update('privacy_policy_seo_description', event.target.value)} />
      <RichTextEditor
        key={activeLocale}
        label={isEs ? 'Contenido de la política (español)' : `Traducción (${activeLocale.toUpperCase()})`}
        value={editorValue}
        onChange={(html) => update('privacy_policy_text', html)}
        allowHeadings
        helperText="Editor visual: títulos, negrita, cursiva y listas. Guardá con el botón de esta pantalla."
      />
      </div>
      {!isEs && <p className="text-xs text-muted mt-3">Si esta traducción está vacía, la web mostrará el texto en español.</p>}
    </Card>
  );
};
