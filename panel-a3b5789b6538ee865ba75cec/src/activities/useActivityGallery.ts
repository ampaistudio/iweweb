import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import type { Activity, ActivityImage } from './types';
import type { MediaItem } from '../api/types';
import { useToast } from '../core/ui/ToastContext';

export function useActivityGallery(
  id: string | undefined,
  isEdit: boolean,
  title: string,
  setImageUrl: (url: string) => void,
  setAltText: (alt: string) => void
) {
  const toast = useToast();
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoInputUrl, setVideoInputUrl] = useState('');
  const [videoInputPoster, setVideoInputPoster] = useState('');
  const [videoInputAlt, setVideoInputAlt] = useState('');
  const [isVideoSubmitting, setIsVideoSubmitting] = useState(false);
  const galleryCardRef = useRef<HTMLDivElement>(null);

  const scrollToGallery = () => {
    galleryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectCoverFromGallery = (img: ActivityImage) => {
    setImageUrl(img.image_url);
    setAltText(img.alt_text);
    toast.success('Foto principal actualizada. Guardá la actividad para confirmar el cambio.');
  };

  const handleAddGalleryImage = async (item: MediaItem) => {
    if (!isEdit || !id) {
      toast.info('Guarda la actividad primero para agregar más fotos a su galería.');
      return;
    }
    try {
      setIsGalleryLoading(true);
      const newImg = (await api.activities.addImage(id, {
        image_url: item.url,
        alt_text: `Foto de ${title || 'actividad iWE'}`,
      })) as ActivityImage;
      setImages((prev) => [...prev, newImg]);
      toast.success(`Foto '${item.original_name}' agregada a la galería.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar imagen a la galería';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
      setGalleryPickerOpen(false);
    }
  };

  const handleSetCover = async (imageId: number) => {
    if (!id) return;
    try {
      setIsGalleryLoading(true);
      await api.activities.setCoverImage(id, imageId);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_cover: img.id === imageId,
        }))
      );
      const cov = images.find((img) => img.id === imageId);
      if (cov) {
        setImageUrl(cov.image_url);
        setAltText(cov.alt_text);
      }
      toast.success('Portada actualizada correctamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar portada';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleRemoveGalleryImage = async (imageId: number) => {
    if (!id) return;
    if (images.length <= 1) {
      toast.error('La actividad debe tener al menos una imagen en la galería.');
      return;
    }
    try {
      setIsGalleryLoading(true);
      await api.activities.removeImage(id, imageId);
      const act = (await api.activities.get(id)) as Activity;
      if (act.images) {
        setImages(act.images);
      }
      setImageUrl(act.image_url || act.image);
      setAltText(act.alt_text || act.alt);
      toast.success('Imagen eliminada de la galería.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar imagen';
      toast.error(msg);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleMoveGalleryImage = async (index: number, direction: 'up' | 'down') => {
    if (!id) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);

    const reordered = newImages.map((img, idx) => ({ ...img, display_order: idx }));
    setImages(reordered);

    try {
      await api.activities.reorderImages(
        id,
        reordered.map((img) => ({ id: img.id, display_order: img.display_order }))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar galería';
      toast.error(msg);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !videoInputUrl.trim()) {
      toast.error('Ingresa una URL de video válida (YouTube, Vimeo o enlace a archivo de video).');
      return;
    }
    setIsVideoSubmitting(true);
    try {
      const newImg = await api.activities.addImage(id, {
        image_url: videoInputUrl.trim(),
        media_type: 'video',
        poster_url: videoInputPoster.trim() || undefined,
        alt_text: videoInputAlt.trim() || `Video de ${title || 'actividad'}`,
      });
      setImages((prev) => [...prev, newImg]);
      setVideoModalOpen(false);
      setVideoInputUrl('');
      setVideoInputPoster('');
      setVideoInputAlt('');
      toast.success('Video agregado a la galería.', 'Galería actualizada');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar video';
      toast.error(msg);
    } finally {
      setIsVideoSubmitting(false);
    }
  };

  return {
    images,
    setImages,
    galleryPickerOpen,
    setGalleryPickerOpen,
    isGalleryLoading,
    videoModalOpen,
    setVideoModalOpen,
    videoInputUrl,
    setVideoInputUrl,
    videoInputPoster,
    setVideoInputPoster,
    videoInputAlt,
    setVideoInputAlt,
    isVideoSubmitting,
    galleryCardRef,
    scrollToGallery,
    handleSelectCoverFromGallery,
    handleAddGalleryImage,
    handleSetCover,
    handleRemoveGalleryImage,
    handleMoveGalleryImage,
    handleAddVideo,
  };
}

