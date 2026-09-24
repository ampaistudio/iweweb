import React from 'react';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import type { ActivityImage } from './types';

interface ActivityGallerySectionProps {
  images: ActivityImage[];
  isGalleryLoading: boolean;
  galleryCardRef: React.RefObject<HTMLDivElement | null>;
  onOpenGalleryPicker: () => void;
  onOpenVideoModal: () => void;
  onMoveImage: (index: number, direction: 'up' | 'down') => void;
  onSetCover: (imageId: number) => void;
  onRemoveImage: (imageId: number) => void;
}

export const ActivityGallerySection: React.FC<ActivityGallerySectionProps> = ({
  images,
  isGalleryLoading,
  galleryCardRef,
  onOpenGalleryPicker,
  onOpenVideoModal,
  onMoveImage,
  onSetCover,
  onRemoveImage,
}) => {
  return (
    <div ref={galleryCardRef}>
      <Card
        title="Galería Multimedia"
        subtitle="Fotos y videos para enriquecer el hero y la página de detalle del tour"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenGalleryPicker}
              isLoading={isGalleryLoading}
            >
              📷 Agregar foto
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenVideoModal}
            >
              🎥 Agregar video (URL)
            </Button>
          </div>
        }
      >
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm border-2 border-dashed border-border rounded-xl">
            No hay fotos ni videos en la galería. Haz clic en "Agregar foto" o "Agregar video" para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative group rounded-xl overflow-hidden border transition-all ${
                  img.is_cover ? 'border-accent ring-2 ring-accent/30 shadow-md' : 'border-border hover:border-border-hover'
                } bg-bg flex flex-col`}
              >
                <div className="aspect-square relative overflow-hidden bg-surface flex items-center justify-center">
                  {img.media_type === 'video' ? (
                    <div className="w-full h-full bg-surface-hover/80 text-primary flex flex-col items-center justify-center p-3 text-center border-b border-border">
                      <span className="w-10 h-10 rounded-full bg-accent/15 text-accent-text flex items-center justify-center text-lg mb-1 font-bold">
                        ▶
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent-text">Video</span>
                      <span className="text-[10px] text-muted truncate max-w-full px-1 mt-0.5" title={img.image_url}>
                        {img.image_url}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={img.image_url}
                      alt={img.alt_text}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {img.is_cover && (
                    <span className="absolute top-2 left-2 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      ★ Portada
                    </span>
                  )}
                  {img.media_type === 'video' && !img.is_cover && (
                    <span className="absolute top-2 left-2 bg-surface text-primary border border-border text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      ▶ Video
                    </span>
                  )}
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between gap-2 text-xs">
                  <p className="text-muted truncate font-mono text-[11px]" title={img.alt_text || img.image_url}>
                    {img.alt_text || (img.media_type === 'video' ? 'Video' : 'Sin texto alt')}
                  </p>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-border">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveImage(index, 'up')}
                        className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-surface-hover transition-colors"
                        title="Mover antes"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => onMoveImage(index, 'down')}
                        className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-surface-hover transition-colors"
                        title="Mover después"
                      >
                        ▶
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {!img.is_cover && (
                        <button
                          type="button"
                          onClick={() => onSetCover(img.id)}
                          className="px-2 py-1 text-[11px] font-medium text-accent-text hover:bg-accent/10 rounded transition-colors"
                          title="Hacer portada principal"
                        >
                          Portada
                        </button>
                      )}
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveImage(img.id)}
                          className="p-1 text-muted hover:text-danger rounded hover:bg-surface-hover transition-colors"
                          title="Eliminar de galería"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

