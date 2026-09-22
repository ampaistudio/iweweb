import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export interface SocialLinksSectionProps {
  form: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  form,
  onChange,
}) => {
  return (
    <Card
      title="Redes Sociales Oficiales"
      subtitle="Enlaces a los perfiles y canales de iWE mostrados en el pie de página (Footer)"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="📷 Instagram (URL)"
          value={form.social_instagram || ''}
          onChange={(e) => onChange('social_instagram', e.target.value)}
          placeholder="https://www.instagram.com/isardwildland/"
        />
        <Input
          label="📘 Facebook (URL)"
          value={form.social_facebook || ''}
          onChange={(e) => onChange('social_facebook', e.target.value)}
          placeholder="https://www.facebook.com/isardwildland/"
        />
        <Input
          label="🦉 TripAdvisor (URL)"
          value={form.social_tripadvisor || ''}
          onChange={(e) => onChange('social_tripadvisor', e.target.value)}
          placeholder="https://www.tripadvisor.com/Attraction_Review..."
        />
        <Input
          label="💬 WhatsApp (Enlace directo o wa.me)"
          value={form.social_whatsapp || ''}
          onChange={(e) => onChange('social_whatsapp', e.target.value)}
          placeholder="https://wa.me/376653769"
        />
        <Input
          label="▶️ YouTube (URL)"
          value={form.social_youtube || ''}
          onChange={(e) => onChange('social_youtube', e.target.value)}
          placeholder="https://www.youtube.com/@isardwildland"
        />
        <Input
          label="🎵 TikTok (URL)"
          value={form.social_tiktok || ''}
          onChange={(e) => onChange('social_tiktok', e.target.value)}
          placeholder="https://www.tiktok.com/@isardwildland"
        />
        <Input
          label="🚴 Strava (Club / Perfil)"
          value={form.social_strava || ''}
          onChange={(e) => onChange('social_strava', e.target.value)}
          placeholder="https://www.strava.com/clubs/..."
        />
        <Input
          label="💼 LinkedIn (Página de Empresa / Perfil)"
          value={form.social_linkedin || ''}
          onChange={(e) => onChange('social_linkedin', e.target.value)}
          placeholder="https://www.linkedin.com/company/isardwildland"
        />
        <Input
          label="✖️ X / Twitter (Perfil)"
          value={form.social_twitter || ''}
          onChange={(e) => onChange('social_twitter', e.target.value)}
          placeholder="https://x.com/isardwildland"
        />
      </div>
    </Card>
  );
};

