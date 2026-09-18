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
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {photoImages.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm space-y-3">
            <p>Esta actividad todavía no tiene fotos en su galería.</p>
            <p className="text-xs">Agregá una foto a la Galería Multimedia primero; luego vas a poder elegirla acá como foto principal.</p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onGoToGallery();
              }}
              className="mt-2"
            >
              Ir a Galería Multimedia
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto p-1">
            {photoImages.map((img) => {
              const isSelected = selectedImageUrl === img.image_url;
              return (
                <div
                  key={img.id}
                  onClick={() => {
                    onSelectImage(img);
                    onClose();
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-surface ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-left">
                    <p className="text-[11px] font-medium text-text-on-overlay truncate">{img.alt_text}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-contrast w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
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
