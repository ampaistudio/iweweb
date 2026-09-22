import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { HeroSlideItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';

export function useHeroSlidesState() {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'external'>('upload');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [slideBeingEdited, setSlideBeingEdited] = useState<HeroSlideItem | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlideItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New slide form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newSlideType, setNewSlideType] = useState<'image' | 'video'>('image');
  const [newSrc, setNewSrc] = useState('');
  const [newPoster, setNewPoster] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [newPublished, setNewPublished] = useState(true);

  // Edit slide form state
  const [editSrc, setEditSrc] = useState('');
  const [editPoster, setEditPoster] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [editSlideType, setEditSlideType] = useState<'image' | 'video'>('image');

  const toast = useToast();

  const loadSlides = async () => {
    try {
      setLoading(true);
      const res = await api.heroSlides.listAll();
      if (res && Array.isArray(res)) {
        setSlides(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las diapositivas del hero';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  // Cleanup object URL preview
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
      setNewSlideType(isVideo ? 'video' : 'image');
      setPreviewUrl(URL.createObjectURL(file));
      if (!newAlt) {
        // Humanized default alt suggestion from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewAlt(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPosterFile(file);
    }
  };

  const resetAddForm = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setSelectedPosterFile(null);
    setPreviewUrl(null);
    setNewSlideType('image');
    setNewSrc('');
    setNewPoster('');
    setNewAlt('');
    setNewPublished(true);
    setAddMode('upload');
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setAddModalOpen(true);
  };

  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlt.trim()) {
      toast.error('El texto alternativo (descripción) es obligatorio para accesibilidad.');
      return;
    }

    setIsSaving(true);
    try {
      if (addMode === 'upload') {
        if (!selectedFile) {
          toast.error('Debes seleccionar un archivo de imagen o video.');
          setIsSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('alt', newAlt.trim());
        formData.append('published', newPublished ? '1' : '0');
        if (selectedPosterFile) {
          formData.append('poster_file', selectedPosterFile);
        } else if (newPoster.trim()) {
          formData.append('poster', newPoster.trim());
        }

        const created = await api.heroSlides.create(formData);
        setSlides((prev) => [...prev, created]);
        toast.success('Nueva diapositiva subida y agregada al carrusel con éxito.', 'Diapositiva creada');
      } else {
        if (!newSrc.trim()) {
          toast.error('Debes ingresar la URL del enlace multimedia.');
          setIsSaving(false);
          return;
        }

        const created = await api.heroSlides.create({
          slide_type: newSlideType,
          media_source: 'external_url',
          src: newSrc.trim(),
          poster: newPoster.trim() || null,
          alt: newAlt.trim(),
          published: newPublished,
        });

        setSlides((prev) => [...prev, created]);
        toast.success('Nueva diapositiva externa agregada al carrusel con éxito.', 'Diapositiva creada');
      }

      setAddModalOpen(false);
      resetAddForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la diapositiva';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (slide: HeroSlideItem) => {
    setSlideBeingEdited(slide);
    setEditSrc(slide.src);
    setEditPoster(slide.poster || '');
    setEditAlt(slide.alt);
    setEditPublished(Boolean(slide.published));
    setEditSlideType(slide.slide_type);
    setEditModalOpen(true);
  };

  const handleUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideBeingEdited) return;
    if (!editAlt.trim()) {
      toast.error('El texto alternativo es obligatorio.');
      return;
    }
    if (!editSrc.trim()) {
      toast.error('La dirección o URL no puede estar vacía.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.heroSlides.update(slideBeingEdited.id, {
        src: editSrc.trim(),
        poster: editPoster.trim() || null,
        alt: editAlt.trim(),
        published: editPublished,
        slide_type: editSlideType,
        media_source: slideBeingEdited.media_source,
      });

      setSlides((prev) =>
        prev.map((item) => (item.id === slideBeingEdited.id ? { ...item, ...updated } : item))
      );
      toast.success('Diapositiva actualizada correctamente.', 'Cambios guardados');
      setEditModalOpen(false);
      setSlideBeingEdited(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la diapositiva';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (slide: HeroSlideItem) => {
    const nextState = !slide.published;
    try {
      await api.heroSlides.update(slide.id, { published: nextState });
      setSlides((prev) =>
        prev.map((item) => (item.id === slide.id ? { ...item, published: nextState } : item))
      );
      toast.success(
        `Diapositiva ahora está ${nextState ? 'Publicada en portada' : 'Oculta'}.`,
        'Estado actualizado'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar visibilidad';
      toast.error(msg);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setIsReordering(true);
    const newItems = [...slides];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update display_order sequence
    const updatedWithOrder = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setSlides(updatedWithOrder);

    try {
      const ids = updatedWithOrder.map((s) => s.id);
      await api.heroSlides.reorder(ids);
      toast.success('Nuevo orden de diapositivas guardado.');
    } catch {
      toast.error('Error al guardar el nuevo orden.');
      // Revert on failure
      loadSlides();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!slideToDelete) return;
    setIsDeleting(true);
    try {
      await api.heroSlides.delete(slideToDelete.id);
      setSlides((prev) => prev.filter((item) => item.id !== slideToDelete.id));
      toast.success('Diapositiva eliminada con éxito del carrusel.', 'Eliminada');
      setSlideToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la diapositiva';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    slides,
    loading,
    isSaving,
    isReordering,
    addModalOpen,
    setAddModalOpen,
    addMode,
    setAddMode,
    editModalOpen,
    setEditModalOpen,
    slideBeingEdited,
    slideToDelete,
    setSlideToDelete,
    isDeleting,
    selectedFile,
    previewUrl,
    setPreviewUrl,
    newSlideType,
    setNewSlideType,
    newSrc,
    setNewSrc,
    newPoster,
    setNewPoster,
    newAlt,
    setNewAlt,
    newPublished,
    setNewPublished,
    editSrc,
    setEditSrc,
    editPoster,
    setEditPoster,
    editAlt,
    setEditAlt,
    editPublished,
    setEditPublished,
    editSlideType,
    setEditSlideType,
    handleFileChange,
    handlePosterFileChange,
    handleOpenAddModal,
    handleCreateSlide,
    handleOpenEditModal,
    handleUpdateSlide,
    handleTogglePublish,
    handleMoveOrder,
    handleDeleteConfirm,
  };
}

