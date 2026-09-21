import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { SectionPublishToggle } from './SectionPublishToggle';
import { DirectReviewsManager } from './DirectReviewsManager';

export interface HomeStaticSectionsProps {
  form: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const HomeStaticSections: React.FC<HomeStaticSectionsProps> = ({
  form,
  onChange,
}) => {
  return (
    <Card
      title="Encabezados de Actividades, Calendario, Clima y Reseñas"
      subtitle="Textos fijos de las secciones de la Home que no dependen del idioma de traducción"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Secciones de actividades (cintillo + título)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              value={form.activities_bike_eyebrow || ''}
              onChange={(e) => onChange('activities_bike_eyebrow', e.target.value)}
              placeholder="Enduro, E-Bike, BTT y remontes"
            />
            <Input
              value={form.activities_bike_title || ''}
              onChange={(e) => onChange('activities_bike_title', e.target.value)}
              placeholder="Bike"
            />
            <Input
              value={form.activities_via_ferrata_eyebrow || ''}
              onChange={(e) => onChange('activities_via_ferrata_eyebrow', e.target.value)}
              placeholder="Iniciación y avanzado"
            />
            <Input
              value={form.activities_via_ferrata_title || ''}
              onChange={(e) => onChange('activities_via_ferrata_title', e.target.value)}
              placeholder="Vía Ferrata"
            />
            <Input
              value={form.activities_4x4_eyebrow || ''}
              onChange={(e) => onChange('activities_4x4_eyebrow', e.target.value)}
              placeholder="Lagos Off-Road, Tor y Pic Negre"
            />
            <Input
              value={form.activities_4x4_title || ''}
              onChange={(e) => onChange('activities_4x4_title', e.target.value)}
              placeholder="4×4"
            />
            <Input
              value={form.activities_senderismo_eyebrow || ''}
              onChange={(e) => onChange('activities_senderismo_eyebrow', e.target.value)}
              placeholder="Medio día y día completo"
            />
            <Input
              value={form.activities_senderismo_title || ''}
              onChange={(e) => onChange('activities_senderismo_title', e.target.value)}
              placeholder="Senderismo"
            />
            <Input
              value={form.activities_esqui_eyebrow || ''}
              onChange={(e) => onChange('activities_esqui_eyebrow', e.target.value)}
              placeholder="Raquetas y esquí tour"
            />
            <Input
              value={form.activities_esqui_title || ''}
              onChange={(e) => onChange('activities_esqui_title', e.target.value)}
              placeholder="Esquí-Snow"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Calendario / Eventos</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Etiqueta de temporada de paquetes"
              value={form.calendar_holiday_label || ''}
              onChange={(e) => onChange('calendar_holiday_label', e.target.value)}
              placeholder="Holiday"
            />
            <Input
              label="Etiqueta de eventos"
              value={form.calendar_events_label || ''}
              onChange={(e) => onChange('calendar_events_label', e.target.value)}
              placeholder="Eventos"
            />
            <Input
              label="Nombre del evento"
              value={form.calendar_events_name || ''}
              onChange={(e) => onChange('calendar_events_name', e.target.value)}
              placeholder="Team Building & Eventos Deportivos"
            />
            <Input
              label="Lugar del evento"
              value={form.calendar_events_place || ''}
              onChange={(e) => onChange('calendar_events_place', e.target.value)}
              placeholder="Andorra"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Sección de Clima (Windy)</label>
          <div className="space-y-4">
            <Input
              label="Cintillo (Eyebrow)"
              value={form.weather_eyebrow || ''}
              onChange={(e) => onChange('weather_eyebrow', e.target.value)}
              placeholder="Condiciones en tiempo real"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Título (Línea 1)"
                value={form.weather_title_line1 || ''}
                onChange={(e) => onChange('weather_title_line1', e.target.value)}
                placeholder="El tiempo en Andorra"
              />
              <Input
                label="Título (Línea 2)"
                value={form.weather_title_line2 || ''}
                onChange={(e) => onChange('weather_title_line2', e.target.value)}
                placeholder="y los Pirineos."
              />
            </div>
            <Textarea
              label="Texto descriptivo"
              rows={2}
              value={form.weather_copy || ''}
              onChange={(e) => onChange('weather_copy', e.target.value)}
              placeholder="Previsión meteorológica y mapa interactivo..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ubicación (barra meta)"
                value={form.weather_meta_location || ''}
                onChange={(e) => onChange('weather_meta_location', e.target.value)}
                placeholder="Andorra (42.55° N, 1.51° E) • Modelo ECMWF"
              />
              <Input
                label="Badge (barra meta)"
                value={form.weather_meta_badge || ''}
                onChange={(e) => onChange('weather_meta_badge', e.target.value)}
                placeholder="Viento & Previsión en vivo"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Sección de Reseñas</label>
          <div className="space-y-4">
            {/* Toggles de publicación por fuente */}
            <div className="space-y-3">
              <SectionPublishToggle
                title="Publicar reseñas de Google"
                activeDescription="Las reseñas de Google se muestran actualmente en la página principal."
                inactiveDescription="Las reseñas de Google están ocultas en la página principal."
                checked={form.reviews_google_published !== 'false' && form.reviews_google_published !== '0'}
                onChange={(checked) => onChange('reviews_google_published', checked ? 'true' : 'false')}
              />

              <SectionPublishToggle
                title="Publicar reseñas de TripAdvisor"
                activeDescription="Las reseñas de TripAdvisor se muestran actualmente en la página principal."
                inactiveDescription="Las reseñas de TripAdvisor están ocultas en la página principal."
                checked={form.reviews_tripadvisor_published !== 'false' && form.reviews_tripadvisor_published !== '0'}
                onChange={(checked) => onChange('reviews_tripadvisor_published', checked ? 'true' : 'false')}
              />

              <SectionPublishToggle
                title="Publicar reseñas directas (iWE)"
                activeDescription="Las reseñas directas se muestran actualmente en la página principal."
                inactiveDescription="Las reseñas directas están ocultas en la página principal."
                checked={form.reviews_direct_published !== 'false' && form.reviews_direct_published !== '0'}
                onChange={(checked) => onChange('reviews_direct_published', checked ? 'true' : 'false')}
              />
            </div>

            <Input
              label="Cintillo (Eyebrow)"
              value={form.reviews_eyebrow || ''}
              onChange={(e) => onChange('reviews_eyebrow', e.target.value)}
              placeholder="Opiniones de clientes"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tab: Todas"
                value={form.reviews_tab_all || ''}
                onChange={(e) => onChange('reviews_tab_all', e.target.value)}
                placeholder="Todas"
              />
              <Input
                label="Tab: Google"
                value={form.reviews_tab_google || ''}
                onChange={(e) => onChange('reviews_tab_google', e.target.value)}
                placeholder="Google ★ 4.9"
              />
              <Input
                label="Tab: TripAdvisor"
                value={form.reviews_tab_tripadvisor || ''}
                onChange={(e) => onChange('reviews_tab_tripadvisor', e.target.value)}
                placeholder="TripAdvisor ★ 5.0"
              />
              <Input
                label="Tab: iWE"
                value={form.reviews_tab_direct || ''}
                onChange={(e) => onChange('reviews_tab_direct', e.target.value)}
                placeholder="iWE"
              />
            </div>
            <p className="text-[11px] text-muted">
              El conteo entre paréntesis del tab "Todas" es dinámico y no se edita aquí.
            </p>

            <DirectReviewsManager
              value={form.reviews_direct_items}
              onChange={(newJson) => onChange('reviews_direct_items', newJson)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Newsletter y Contacto</label>
          <div className="space-y-4">
            <Input
              label="Mensaje de suscripción exitosa"
              value={form.newsletter_success_message || ''}
              onChange={(e) => onChange('newsletter_success_message', e.target.value)}
              placeholder="Ya formas parte de la lista. Nos vemos en la montaña."
            />
            <Input
              label="Label / placeholder del campo de email"
              value={form.newsletter_email_label || ''}
              onChange={(e) => onChange('newsletter_email_label', e.target.value)}
              placeholder="Tu correo electrónico"
            />
            <Input
              label="Link de WhatsApp en Contacto"
              value={form.contact_whatsapp_link || ''}
              onChange={(e) => onChange('contact_whatsapp_link', e.target.value)}
              placeholder="O escríbenos directamente"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

