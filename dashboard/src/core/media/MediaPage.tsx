import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../api/client';
import type { MediaItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MediaUploader } from './MediaUploader';

export const MediaPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.media.list();
      setItems(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar fotos';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUploadSuccess = (newItem: MediaItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      await api.media.delete(itemToDelete.id);
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      toast.success(`Foto '${itemToDelete.original_name}' eliminada correctamente.`, 'Foto eliminada');
      setItemToDelete(null);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(err.message, 'No se puede eliminar');
      } else {
        const msg = err instanceof Error ? err.message : 'Error al eliminar la foto';
        toast.error(msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Galería Multimedia</h2>
          <p className="text-sm text-stone-400 mt-1">
            Sube y administra las fotos de actividades, novedades y encabezados de iWE.
          </p>
        </div>
      </div>

      {/* Uploader Section */}
      <Card title="Subir Nueva Foto" subtitle="Formatos JPG, PNG y WebP (Máx 8 MB)">
        <MediaUploader onUploadSuccess={handleUploadSuccess} />
      </Card>

      {/* Media Grid */}
      <Card
        title="Fotos en la Galería"
        subtitle={`Total: ${items.length} imágenes`}
        action={
          <Button variant="ghost" size="sm" onClick={loadMedia} isLoading={loading}>
            🔄 Actualizar
          </Button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando fotos...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-stone-500 text-sm">
            <p className="text-2xl mb-2">📸</p>
            <p>Todavía no hay fotos en la galería.</p>
            <p className="text-xs text-stone-600 mt-1">Usa la caja de arriba para subir la primera imagen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden flex flex-col justify-between hover:border-stone-700 transition-all shadow-md"
              >
                {/* Image preview */}
                <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-300 border border-stone-800">
                    {formatFileSize(item.size_bytes)}
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200 truncate" title={item.original_name}>
                      {item.original_name}
                    </h4>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Subida el{' '}
                      {new Date(item.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-800/80">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(item.url);
                        toast.success('Enlace copiado al portapapeles.', 'Copiado');
                      }}
                      className="flex-1 text-xs py-1 h-8"
                      title="Copiar enlace directo"
                    >
                      🔗 Copiar link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setItemToDelete(item)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs py-1 h-8 px-2.5"
                      title="Eliminar foto"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar esta foto?"
        message={
          itemToDelete
            ? `¿Estás seguro de que quieres eliminar '${itemToDelete.original_name}'? Si la imagen está en uso por alguna actividad o publicación, el sistema impedirá su borrado para proteger el sitio.`
            : ''
        }
        confirmText="Sí, eliminar foto"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
