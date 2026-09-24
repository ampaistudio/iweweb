import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { MediaItem } from '../../api/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MediaUploader } from './MediaUploader';

export interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (item: MediaItem) => void;
  selectedImageUrl?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  selectedImageUrl,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.media.list();
      setItems(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const handleUploaded = (item: MediaItem) => {
    setItems((prev) => [item, ...prev]);
    onSelectImage(item);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar foto de la galería"
      description="Elige una foto existente o sube una nueva para esta publicación o actividad."
      maxWidth="5xl"
    >
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-accent text-accent-contrast shadow-md'
                : 'bg-surface-elevated/80 text-secondary hover:bg-surface-elevated'
            }`}
          >
            📸 Ver galería ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-accent text-accent-contrast shadow-md'
                : 'bg-surface-elevated/80 text-secondary hover:bg-surface-elevated'
            }`}
          >
            ➕ Subir foto nueva
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="py-2">
            <MediaUploader onUploadSuccess={handleUploaded} />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Cargando fotos...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-muted text-sm">
                <p className="text-base font-medium text-primary">No hay fotos subidas todavía.</p>
                <p className="text-xs mt-1">Sube imágenes para agregarlas a la galería multimedia.</p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setActiveTab('upload')}
                  className="mt-4"
                >
                  Subir la primera foto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[min(68dvh,760px)] overflow-y-auto overflow-x-hidden p-2">
                {items.map((item) => {
                  const isSelected = selectedImageUrl === item.url || selectedImageUrl?.includes(item.filename);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectImage(item);
                        onClose();
                      }}
                      className={`group relative aspect-[3/2] min-w-0 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all bg-surface shadow-sm hover:shadow-md ${
                        isSelected
                          ? 'border-accent ring-4 ring-accent/30 scale-[0.99]'
                          : 'border-border hover:border-accent/60'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.original_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-left">
                        <p className="text-xs font-semibold text-text-on-overlay truncate">{item.original_name}</p>
                        <p className="text-[10px] text-text-on-overlay/70 mt-0.5">{item.mime_type}</p>
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
