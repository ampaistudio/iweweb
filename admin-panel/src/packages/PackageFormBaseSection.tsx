import React from 'react';
import type { PackageItem } from '../api/types';
import { Input } from '../core/ui/Input';
import { Textarea } from '../core/ui/Textarea';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { Button } from '../core/ui/Button';
import type { PackageFormState } from './packageTypes';

export interface PackageFormBaseSectionProps {
  formData: PackageFormState;
  editingPackage: PackageItem | null;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormState>>;
  onTitleChange: (val: string) => void;
  onOpenPicker: () => void;
}

export const PackageFormBaseSection: React.FC<PackageFormBaseSectionProps> = ({
  formData,
  editingPackage,
  setFormData,
  onTitleChange,
  onOpenPicker,
}) => {
  return (
    <>
      {/* 1. Base Info */}
      <div className="space-y-4">
        <Input
          label="Título del Paquete (Español)"
          value={formData.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Andorra Holiday & Bike 8 Días / 7 Noches"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Identificador URL (Slug)"
            value={formData.id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              }))
            }
            placeholder="andorra-holiday-8d"
            disabled={Boolean(editingPackage)}
            helperText={
              editingPackage
                ? 'El identificador no se puede modificar tras crearse.'
                : 'Identificador único en minúsculas y guiones.'
            }
            required
          />

          <Input
            label="Duración"
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            placeholder="8 días / 7 noches"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Monto de Precio (€)"
            type="number"
            step="0.01"
            value={formData.price_amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price_amount: e.target.value }))
            }
            placeholder="639.00"
            helperText="Número sin símbolo (ej: 639.00)"
          />

          <Select
            label="Moneda"
            value={formData.price_currency}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price_currency: e.target.value }))
            }
            options={[
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'USD', label: 'USD ($)' },
            ]}
          />

          <Input
            label="Unidad de Precio"
            value={formData.price_unit}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price_unit: e.target.value }))
            }
            placeholder="por persona"
          />
        </div>
      </div>

      {/* 2. Photo */}
      <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Foto Principal del Paquete
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenPicker}
          >
            📸 Seleccionar foto
          </Button>
        </div>

        {formData.image_url ? (
          <div className="flex items-center gap-3">
            <img
              src={formData.image_url}
              alt="Foto previa"
              className="w-20 h-16 rounded-xl object-cover border border-border bg-surface"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium truncate">{formData.image_url}</p>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                className="text-[11px] text-danger-text hover:text-danger mt-0.5"
              >
                Quitar foto
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted italic">Sin foto asignada todavía.</p>
        )}

        <Input
          label="Texto alternativo (Alt Text)"
          value={formData.alt_text}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
          }
          placeholder="Ej: Vacaciones de Mountain Bike y alojamiento en Andorra"
        />
      </div>

      {/* 3. Description */}
      <Textarea
        label="Descripción del Paquete (Español)"
        rows={4}
        value={formData.description}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value }))
        }
        placeholder="Describe el itinerario, hoteles incluidos, actividades y traslados..."
        required
      />

      {/* 4. Publication & Schedule */}
      <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
        <Toggle
          label="Publicado en el sitio web"
          description="Si está desactivado, el paquete quedará como borrador y no aparecerá en el sitio público."
          checked={formData.published}
          onChange={(checked) =>
            setFormData((prev) => ({ ...prev, published: checked }))
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              📅 Fecha de Inicio de Publicación (opcional)
            </label>
            <input
              type="datetime-local"
              value={formData.publish_at}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, publish_at: e.target.value }))
              }
              className="w-full bg-surface border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 min-h-[40px]"
            />
            <p className="text-[11px] text-muted mt-1">
              Ideal para activar automáticamente antes de temporada.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              📅 Fecha de Fin de Publicación (opcional)
            </label>
            <input
              type="datetime-local"
              value={formData.unpublish_at}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, unpublish_at: e.target.value }))
              }
              className="w-full bg-surface border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 min-h-[40px]"
            />
            <p className="text-[11px] text-muted mt-1">
              Ideal para desactivar automáticamente al final de temporada.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

