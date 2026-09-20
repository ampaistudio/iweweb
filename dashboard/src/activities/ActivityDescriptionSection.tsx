import React from 'react';
import { Card } from '../core/ui/Card';
import { Input } from '../core/ui/Input';
import { Button } from '../core/ui/Button';
import { RichTextEditor } from '../core/ui/RichTextEditor';

interface ActivityDescriptionSectionProps {
  introTitle: string;
  setIntroTitle: (val: string) => void;
  introText: string;
  setIntroText: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  highlights: string[];
  onAddHighlight: () => void;
  onHighlightChange: (index: number, val: string) => void;
  onRemoveHighlight: (index: number) => void;
}

export const ActivityDescriptionSection: React.FC<ActivityDescriptionSectionProps> = ({
  introTitle,
  setIntroTitle,
  introText,
  setIntroText,
  description,
  setDescription,
  highlights,
  onAddHighlight,
  onHighlightChange,
  onRemoveHighlight,
}) => {
  return (
    <Card
      title="Descripción y Puntos Destacados"
      subtitle="Explicación detallada y lista de qué incluye"
    >
      <div className="space-y-6">
        {/* Introducción */}
        <div className="space-y-3 pb-5 border-b border-border">
          <Input
            label="Título de introducción (opcional)"
            value={introTitle}
            onChange={(e) => setIntroTitle(e.target.value)}
            placeholder="Ej: Volá sobre los Pirineos"
            helperText="Se muestra como título grande entre la foto de cabecera y la ficha técnica. Dejalo vacío para no mostrar esta sección."
          />
          <RichTextEditor
            label="Texto de introducción (opcional)"
            value={introText}
            onChange={setIntroText}
            placeholder="Breve presentación de la actividad, antes de la descripción detallada..."
          />
        </div>

        {/* Descripción */}
        <RichTextEditor
          label="Descripción completa (Español - Principal)"
          value={description}
          onChange={setDescription}
          placeholder="Escribe el texto detallado de la ruta, el entorno y los atractivos de esta actividad..."
        />

        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
              Puntos destacados / Qué incluye
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddHighlight}
            >
              + Agregar punto
            </Button>
          </div>

          <div className="space-y-2">
            {highlights.map((h, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => onHighlightChange(index, e.target.value)}
                  placeholder={`Punto destacado #${index + 1} (ej. Guía certificado AADIDES/ISIA)`}
                  className="flex-1 bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                />
                {highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveHighlight(index)}
                    className="p-2 text-muted hover:text-danger rounded-xl hover:bg-surface-hover transition-colors"
                    title="Eliminar punto"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
