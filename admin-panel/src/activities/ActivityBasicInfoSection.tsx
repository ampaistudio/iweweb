import React from 'react';
import { Card } from '../core/ui/Card';
import { Input } from '../core/ui/Input';
import { Select } from '../core/ui/Select';
import { Button } from '../core/ui/Button';
import { Toggle } from '../core/ui/Toggle';
import type { ActivityType } from './types';

interface ActivityBasicInfoSectionProps {
  title: string;
  onTitleChange: (val: string) => void;
  type: ActivityType;
  setType: (val: ActivityType) => void;
  availableCategories: string[];
  onOpenCategoryModal: () => void;
  slugId: string;
  setSlugId: (val: string) => void;
  isEdit: boolean;
  region: string;
  setRegion: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  imageUrl: string;
  setImageUrl: (val: string) => void;
  altText: string;
  setAltText: (val: string) => void;
  onOpenPicker: () => void;
  published: boolean;
  setPublished: (val: boolean) => void;
}

export const ActivityBasicInfoSection: React.FC<ActivityBasicInfoSectionProps> = ({
  title,
  onTitleChange,
  type,
  setType,
  availableCategories,
  onOpenCategoryModal,
  slugId,
  setSlugId,
  isEdit,
  region,
  setRegion,
  country,
  setCountry,
  level,
  setLevel,
  duration,
  setDuration,
  price,
  setPrice,
  imageUrl,
  setImageUrl,
  altText,
  setAltText,
  onOpenPicker,
  published,
  setPublished,
}) => {
  return (
    <>
      {/* 1. Información Principal */}
      <Card
        title="Información Principal"
        subtitle="Nombre, categoría y ubicación"
      >
        <div className="space-y-4">
          <Input
            label="Título de la actividad (Español - Principal)"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ej: E-Bike Enduro en Forn de Canillo"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Categoría / Tipo de experiencia
                </label>
                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="text-xs text-accent hover:underline font-medium cursor-pointer"
                >
                  🏷️ Gestionar
                </button>
              </div>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                options={availableCategories.map((t) => ({ value: t, label: t }))}
                helperText="El sitio público agrupa los menús por esta categoría."
              />
            </div>

            <Input
              label="Identificador URL (Slug)"
              value={slugId}
              onChange={(e) => setSlugId(e.target.value)}
              placeholder="ebike-forn-canillo"
              disabled={isEdit}
              helperText={isEdit ? 'El identificador no se puede modificar tras crearse.' : 'Se usa en el enlace /tour/:id'}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Región / Zona"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Ej: Canillo, Grandvalira, Pirineos"
              required
            />

            <Input
              label="País"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Andorra / España"
              required
            />
          </div>
        </div>
      </Card>

      {/* 2. Detalles del Recorrido */}
      <Card title="Detalles del Recorrido" subtitle="Nivel, duración y precio (compartidos)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nivel / Dificultad"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Principiante, Intermedio +, etc."
            required
          />

          <Input
            label="Duración"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="4 horas, Día completo, etc."
            required
          />

          <Input
            label="Precio (€, opcional)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="85 € por persona"
            helperText="Dejar vacío si no aplica precio fijo."
          />
        </div>
      </Card>

      {/* 3. Foto Principal */}
      <Card title="Foto Principal" subtitle="Imagen de cabecera y accesibilidad">
        <div className="space-y-4">
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={imageUrl}
                alt={altText || 'Foto de actividad'}
                className="w-full sm:w-40 h-32 rounded-xl object-cover border border-border flex-shrink-0"
              />
              <div className="flex-1 space-y-2 w-full text-left">
                <p className="text-xs font-semibold text-primary">Foto asignada a la actividad</p>
                <p className="text-[11px] text-muted break-all">{imageUrl}</p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onOpenPicker}
                  >
                    Cambiar foto
                  </Button>
                  {isEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageUrl('')}
                      className="text-danger-text hover:text-danger"
                    >
                      Quitar foto
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPicker}
              leftIcon="📸"
              className="w-full justify-center py-6 border-dashed"
            >
              Elegir foto de la galería
            </Button>
          )}
          {isEdit && (
            <p className="text-[11px] text-muted">
              La foto principal se elige entre las fotos que ya están en la Galería Multimedia de esta actividad.
            </p>
          )}

          <Input
            label="Texto alternativo de la foto (accesibilidad)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Ej: Excursión en 4x4 por los caminos de alta montaña en Andorra"
            helperText="Describe la foto para lectores de pantalla y buscadores."
            required
          />
        </div>
      </Card>

      {/* 5. Estado de Publicación */}
      <Card title="Estado de Publicación" subtitle="Control de visibilidad en el sitio web">
        <div className="space-y-4">
          <Toggle
            label="Publicado en el sitio web"
            description="Si está activado, la actividad aparecerá de inmediato en los menús y listados públicos."
            checked={published}
            onChange={setPublished}
          />
        </div>
      </Card>
    </>
  );
};

