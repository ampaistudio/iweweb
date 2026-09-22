import React, { useState, useRef } from 'react';
import { api } from '../../api/client';
import type { MediaItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';

export interface MediaUploaderProps {
  onUploadSuccess?: (item: MediaItem) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Client-side quick check
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen supera el límite máximo de 8 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedItem = await api.media.upload(file);
      toast.success(`Foto '${uploadedItem.original_name}' subida con éxito.`, 'Imagen guardada');
      if (onUploadSuccess) {
        onUploadSuccess(uploadedItem);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir la imagen';
      toast.error(msg, 'Fallo de subida');
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
        isDragging
          ? 'border-accent bg-accent-soft/20'
          : 'border-border-strong/80 bg-surface/50 hover:border-border-strong'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated text-secondary flex items-center justify-center text-2xl">
          {isUploading ? (
            <div className="w-6 h-6 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            '📸'
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-primary">
            {isUploading ? 'Subiendo imagen...' : 'Arrastra una foto aquí o haz clic para seleccionarla'}
          </p>
          <p className="text-xs text-muted mt-1">
            Formatos soportados: JPG, PNG, WebP (Hasta 8 MB)
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isUploading}
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-1"
        >
          Seleccionar archivo del dispositivo
        </Button>
      </div>
    </div>
  );
};
