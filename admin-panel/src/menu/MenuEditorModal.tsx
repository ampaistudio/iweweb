import React from 'react';
import type { MenuItem, MenuLinkType, DashboardLocale } from '../api/types';
import { Modal } from '../core/ui/Modal';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';
import { LINK_TYPE_OPTIONS, MenuFormState, NonEsLocale } from './menuTypes';

export interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: MenuItem | null;
  formData: MenuFormState;
  setFormData: React.Dispatch<React.SetStateAction<MenuFormState>>;
  formLocale: DashboardLocale;
  setFormLocale: (loc: DashboardLocale) => void;
  isSaving: boolean;
  parentOptions: Array<{ value: string; label: string }>;
  onSubmit: (e: React.FormEvent) => void;
}

export const MenuEditorModal: React.FC<MenuEditorModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  formData,
  setFormData,
  formLocale,
  setFormLocale,
  isSaving,
  parentOptions,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? `Editar Elemento: ${editingItem.label}` : 'Crear Elemento de Menú'}
      description="Define la etiqueta, el tipo de destino, la jerarquía y las traducciones multi-idioma."
      maxWidth="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Language Selector Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Idioma de Edición:
            </span>
            <span className="text-[11px] text-muted">
              {formLocale === 'es' ? 'Español es el idioma base.' : 'Traducciones para el menú.'}
            </span>
          </div>
          <LanguageTabs
            activeLocale={formLocale}
            onChangeLocale={setFormLocale}
            hasTranslation={(loc) => {
              if (loc === 'es') return Boolean(formData.label.trim());
              const l = formData.translations[loc as NonEsLocale]?.label;
              return Boolean(l && l.trim());
            }}
          />
        </div>

        {formLocale === 'es' ? (
          <>
            {/* Base Info (ES) */}
            <div className="space-y-4">
              <Input
                label="Nombre / Etiqueta del Menú (Español)"
                value={formData.label}
                onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Ej: Tours en Andorra, Raquetas de Nieve, etc."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Enlace"
                  value={formData.link_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      link_type: e.target.value as MenuLinkType,
                    }))
                  }
                  options={LINK_TYPE_OPTIONS}
                  helperText="Define cómo navegará el usuario al hacer clic."
                />

                <Select
                  label="Elemento Padre (Jerarquía)"
                  value={formData.parent_id !== null ? String(formData.parent_id) : ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  options={parentOptions}
                  helperText="Selecciona una categoría padre o deja en la raíz."
                />
              </div>

              <Input
                label="Destino / Enlace / Slug"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, target_value: e.target.value }))
                }
                placeholder={
                  formData.link_type === 'route'
                    ? '/privacidad'
                    : formData.link_type === 'activity'
                    ? 'ebike-arcalis'
                    : formData.link_type === 'package'
                    ? 'andorra-holiday-8d'
                    : formData.link_type === 'anchor'
                    ? '/#viajes-medida'
                    : 'https://ejemplo.com'
                }
                helperText={
                  formData.link_type === 'activity'
                    ? 'Identificador slug de la actividad de turismo.'
                    : formData.link_type === 'package'
                    ? 'Identificador slug del paquete multidía.'
                    : formData.link_type === 'anchor'
                    ? 'Ruta con ancla de página.'
                    : 'Ruta o URL.'
                }
                required
              />
            </div>

            {/* Scheduling & Publication */}
            <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
              <Toggle
                label="Publicado en el sitio web"
                description="Si está desactivado, el elemento y sus subitems no aparecerán en el menú público."
                checked={formData.published}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, published: checked }))
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                    📅 Mostrar a partir de (opcional)
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
                    Dejar vacío para mostrar inmediatamente.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                    📅 Ocultar a partir de (opcional)
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
                    Ideal para temporadas de verano o invierno.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Translation form for CA, EN, FR */
          <div className="space-y-4">
            <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
              <span className="font-semibold text-primary block mb-1">Nombre base en Español:</span>
              <p className="italic font-medium">{formData.label || '(Sin nombre ingresado aún)'}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                  Nombre en {formLocale.toUpperCase()}
                </label>
                <AiTranslateButton
                  sourceText={formData.label}
                  targetLocale={formLocale}
                  fieldName="Nombre del menú"
                  onTranslated={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [formLocale as NonEsLocale]: { label: val },
                      },
                    }))
                  }
                />
              </div>
              <Input
                value={formData.translations[formLocale as NonEsLocale]?.label || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [formLocale as NonEsLocale]: { label: val },
                    },
                  }));
                }}
                placeholder={`Etiqueta traducida (${formLocale.toUpperCase()})...`}
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
          >
            💾 Guardar elemento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

