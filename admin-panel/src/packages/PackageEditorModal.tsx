import React from 'react';
import type { PackageItem, DashboardLocale, MediaItem, MenuItem } from '../api/types';
import { Modal } from '../core/ui/Modal';
import { Button } from '../core/ui/Button';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { ImagePickerModal } from '../core/media/ImagePickerModal';
import { PackageFormBaseSection } from './PackageFormBaseSection';
import { PackageFormTranslationsSection } from './PackageFormTranslationsSection';
import { PackageMediaSection } from './PackageMediaSection';
import type { PackageFormState, NonEsLocale } from './packageTypes';

export interface PackageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPackage: PackageItem | null;
  menuGroups: MenuItem[];
  formData: PackageFormState;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormState>>;
  formLocale: DashboardLocale;
  setFormLocale: (loc: DashboardLocale) => void;
  isSaving: boolean;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  pickerTarget: 'cover' | 'gallery';
  setPickerTarget: (target: 'cover' | 'gallery') => void;
  onTitleChange: (val: string) => void;
  onSelectImage: (item: MediaItem) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PackageEditorModal: React.FC<PackageEditorModalProps> = ({
  isOpen,
  onClose,
  editingPackage,
  menuGroups,
  formData,
  setFormData,
  formLocale,
  setFormLocale,
  isSaving,
  pickerOpen,
  setPickerOpen,
  pickerTarget,
  setPickerTarget,
  onTitleChange,
  onSelectImage,
  onSubmit,
}) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingPackage ? `Editar Paquete: ${editingPackage.title}` : 'Crear Paquete Multidía'}
        description="Configura el título, duración, descripción, precio y programación de visibilidad."
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
                {formLocale === 'es' ? 'Español es el idioma base obligatorio.' : 'Traducción para el paquete.'}
              </span>
            </div>
            <LanguageTabs
              activeLocale={formLocale}
              onChangeLocale={setFormLocale}
              hasTranslation={(loc) => {
                if (loc === 'es') return Boolean(formData.title.trim());
                const t = formData.translations[loc as NonEsLocale];
                return Boolean(t?.title?.trim() || t?.description?.trim());
              }}
            />
          </div>

          {formLocale === 'es' ? (
            <PackageFormBaseSection
              formData={formData}
              editingPackage={editingPackage}
              menuGroups={menuGroups}
              setFormData={setFormData}
              onTitleChange={onTitleChange}
              onOpenPicker={() => { setPickerTarget('cover'); setPickerOpen(true); }}
            />
          ) : (
            <PackageFormTranslationsSection
              formData={formData}
              formLocale={formLocale as NonEsLocale}
              setFormData={setFormData}
            />
          )}

          {formLocale === 'es' && (
            <PackageMediaSection
              formData={formData}
              setFormData={setFormData}
              onOpenPicker={() => { setPickerTarget('gallery'); setPickerOpen(true); }}
            />
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
              💾 Guardar paquete
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Picker */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImage={onSelectImage}
        selectedImageUrl={pickerTarget === 'cover' ? formData.image_url : undefined}
      />
    </>
  );
};
