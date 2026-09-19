import React from 'react';
import type { ActivityImage } from './types';
import { Modal } from '../core/ui/Modal';
import { Button } from '../core/ui/Button';

export interface CoverImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: ActivityImage) => void;
  images: ActivityImage[];
  selectedImageUrl?: string;
  onGoToGallery: () => void;
}

export const CoverImagePickerModal: React.FC<CoverImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  images,
  selectedImageUrl,
  onGoToGallery,
}) => {
  const photoImages = images.filter((img) => img.media_type !== 'video');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Elegir foto principal"
      description="La foto principal se elige entre las fotos ya agregadas a la galería de esta actividad."
      maxWidth="5xl"
    >
      <div className="space-y-5">
        {photoImages.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm space-y-3">
            <p className="text-base font-medium text-primary">Esta actividad todavía no tiene fotos en su galería.</p>
            <p className="text-xs max-w-md mx-auto">Agregá una foto a la Galería Multimedia primero; luego vas a poder elegirla acá como foto principal.</p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onGoToGallery();
              }}
              className="mt-3"
            >
              Ir a Galería Multimedia
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[540px] overflow-y-auto p-1">
            {photoImages.map((img) => {
              const isSelected = selectedImageUrl === img.image_url;
              return (
                <div
                  key={img.id}
                  onClick={() => {
                    onSelectImage(img);
                    onClose();
                  }}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all bg-surface shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'border-accent ring-4 ring-accent/30 scale-[0.99]'
                      : 'border-border hover:border-accent/60'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-left">
                    <p className="text-xs font-semibold text-text-on-overlay truncate">{img.alt_text || 'Foto de galería'}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-accent text-accent-contrast w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white/30">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
