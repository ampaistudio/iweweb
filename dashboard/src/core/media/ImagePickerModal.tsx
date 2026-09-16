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
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-accent text-white shadow-md'
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
                ? 'bg-accent text-white shadow-md'
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
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Cargando fotos...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                <p>No hay fotos subidas todavía.</p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('upload')}
                  className="mt-3"
                >
                  Subir la primera foto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto p-1">
                {items.map((item) => {
                  const isSelected = selectedImageUrl === item.url || selectedImageUrl?.includes(item.filename);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectImage(item);
                        onClose();
                      }}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-surface ${
                        isSelected
                          ? 'border-accent ring-2 ring-accent/30'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.original_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-left">
                        <p className="text-[11px] font-medium text-white truncate">{item.original_name}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
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
