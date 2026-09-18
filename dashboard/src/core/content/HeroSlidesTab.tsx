import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { HeroSlideItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toggle } from '../ui/Toggle';

export const HeroSlidesTab: React.FC = () => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando diapositivas del carrusel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-primary">
            Carrusel de Portada (Hero Slideshow)
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Gestiona las fotos y videos destacados que reciben a los visitantes en la pantalla principal.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto"
        >
          ➕ Agregar diapositiva
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div className="text-xs text-secondary space-y-1">
          <p className="font-semibold text-primary">Consejo de optimización para el Hero</p>
          <p className="text-muted leading-relaxed">
            Puedes alternar imágenes de alta calidad (JPG, WebP) y videos cortos en bucle (MP4, WebM hasta 25 MB) o enlazar contenido externo. Utiliza las flechas de orden para decidir qué slide aparece primero al cargar el sitio.
          </p>
        </div>
      </div>

      {/* Slides List */}
      {slides.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted">
            <span className="text-4xl block mb-2">🎬</span>
            <p className="text-sm font-semibold text-primary">No hay diapositivas configuradas</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              El sitio público utilizará temporalmente las diapositivas estáticas por defecto hasta que agregues contenido aquí.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              className="mt-4"
            >
              Agregar la primera diapositiva
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => {
            const isFirst = index === 0;
            const isLast = index === slides.length - 1;
            const isVideo = slide.slide_type === 'video';

            return (
              <div
                key={slide.id}
                className={`bg-surface border rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center gap-4 ${
                  slide.published
                    ? 'border-border hover:border-border-strong'
                    : 'border-border/60 opacity-70 bg-surface/60'
                }`}
              >
                {/* Reorder Buttons */}
                <div className="flex md:flex-col items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={isFirst || isReordering}
                    title="Mover arriba"
                    className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ▲
                  </button>
                  <span className="text-[11px] font-mono text-muted px-1.5 py-0.5">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={isLast || isReordering}
                    title="Mover abajo"
                    className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ▼
                  </button>
                </div>

                {/* Media Preview Box */}
                <div className="w-full md:w-48 h-32 md:h-28 rounded-xl overflow-hidden bg-bg border border-border relative flex-shrink-0 flex items-center justify-center group">
                  {isVideo ? (
                    <video
                      src={slide.src}
                      poster={slide.poster || undefined}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                      loading="lazy"
                    />
                  )}
                  {isVideo && (
                    <div className="absolute inset-0 bg-bg/60 flex items-center justify-center pointer-events-none">
                      <span className="w-8 h-8 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-xs shadow-md">
                        ▶
                      </span>
                    </div>
                  )}
                </div>

                {/* Slide Info & Badges */}
                <div className="flex-1 min-w-0 space-y-2 w-full text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isVideo ? 'info' : 'neutral'} size="sm">
                      {isVideo ? '🎬 Video' : '🖼️ Imagen'}
                    </Badge>
                    <Badge
                      variant={slide.media_source === 'upload' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {slide.media_source === 'upload' ? '💾 Archivo hosting' : '🌐 Enlace externo'}
                    </Badge>
                    <Badge variant={slide.published ? 'success' : 'neutral'} size="sm">
                      {slide.published ? 'Visible en portada' : 'Oculto'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-primary line-clamp-1" title={slide.alt}>
                      {slide.alt}
                    </p>
                    <p className="text-[11px] text-muted font-mono truncate mt-0.5" title={slide.src}>
                      {slide.src}
                    </p>
                    {slide.poster && (
                      <p className="text-[10px] text-faint truncate mt-0.5" title={`Póster: ${slide.poster}`}>
                        Póster: {slide.poster}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                  <Button
                    type="button"
                    variant={slide.published ? 'ghost' : 'outline'}
                    size="sm"
                    onClick={() => handleTogglePublish(slide)}
                    title={slide.published ? 'Ocultar del sitio público' : 'Publicar en el sitio público'}
                  >
                    {slide.published ? '👁️ Ocultar' : '✨ Publicar'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEditModal(slide)}
                  >
                    ✏️ Editar
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSlideToDelete(slide)}
                    className="text-danger-text hover:text-danger hover:bg-danger-soft"
                    title="Eliminar diapositiva"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Agregar Diapositiva Nueva */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Agregar diapositiva al Hero"
        description="Sube una foto o video a tu hosting o enlaza contenido multimedia externo."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSlide} className="space-y-6">
          {/* Mode Selector Tabs */}
          <div className="flex gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => {
                setAddMode('upload');
                if (!selectedFile) setPreviewUrl(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                addMode === 'upload'
                  ? 'bg-accent text-accent-contrast shadow-md'
                  : 'bg-surface-elevated text-secondary hover:bg-surface-hover'
              }`}
            >
              <span>💾 Subir archivo directo</span>
              <span className="text-[10px] opacity-80">(Imágenes o Videos hasta 25MB)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode('external');
                setPreviewUrl(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                addMode === 'external'
                  ? 'bg-accent text-accent-contrast shadow-md'
                  : 'bg-surface-elevated text-secondary hover:bg-surface-hover'
              }`}
            >
              <span>🌐 Enlace / URL externa</span>
              <span className="text-[10px] opacity-80">(CDN, Vimeo, Web)</span>
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {addMode === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Seleccionar archivo multimedia
                </label>
                <div className="border-2 border-dashed border-border-strong rounded-2xl p-6 text-center bg-bg hover:border-accent transition-colors">
                  <input
                    type="file"
                    id="hero-file-input"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="hero-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-3xl">📁</span>
                    <span className="text-sm font-semibold text-primary">
                      {selectedFile ? selectedFile.name : 'Haz clic para explorar o arrastra aquí'}
                    </span>
                    <span className="text-xs text-muted">
                      JPG, PNG, WebP (hasta 8 MB) o MP4, WebM (hasta 25 MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* Local File Preview */}
              {previewUrl && (
                <div className="rounded-xl overflow-hidden bg-surface-elevated border border-border p-3 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-bg relative flex-shrink-0 flex items-center justify-center">
                    {newSlideType === 'video' ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Previsualización"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 text-left w-full">
                    <p className="text-xs font-bold text-primary truncate">{selectedFile?.name}</p>
                    <p className="text-[11px] text-muted">
                      Tamaño: {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                    </p>
                    <Badge variant={newSlideType === 'video' ? 'info' : 'success'} size="sm">
                      {newSlideType === 'video' ? '🎬 Video detectado' : '🖼️ Imagen detectada'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Optional Poster for Video */}
              {newSlideType === 'video' && (
                <div className="border border-border rounded-xl p-3 bg-surface-elevated/40 space-y-2">
                  <label className="block text-xs font-semibold text-secondary">
                    Miniatura / Póster opcional para video
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePosterFileChange}
                    className="block w-full text-xs text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-elevated file:text-primary hover:file:bg-surface-hover cursor-pointer"
                  />
                  <p className="text-[10px] text-muted">
                    Imagen que se muestra mientras el video comienza a reproducirse (opcional).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: External URL */}
          {addMode === 'external' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewSlideType('image')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    newSlideType === 'image'
                      ? 'bg-accent-soft text-accent-text border-accent/40 shadow-sm'
                      : 'bg-surface-elevated text-secondary border-border hover:bg-surface-hover'
                  }`}
                >
                  <span>🖼️ Imagen web</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewSlideType('video')}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    newSlideType === 'video'
                      ? 'bg-accent-soft text-accent-text border-accent/40 shadow-sm'
                      : 'bg-surface-elevated text-secondary border-border hover:bg-surface-hover'
                  }`}
                >
                  <span>🎬 Video web</span>
                </button>
              </div>

              <Input
                label="URL directa del recurso multimedia"
                value={newSrc}
                onChange={(e) => setNewSrc(e.target.value)}
                placeholder="https://ejemplo.com/videos/hero.mp4 o https://..."
                required
              />

              {newSlideType === 'video' && (
                <Input
                  label="URL del póster o miniatura (opcional)"
                  value={newPoster}
                  onChange={(e) => setNewPoster(e.target.value)}
                  placeholder="https://ejemplo.com/imagenes/poster.jpg"
                />
              )}
            </div>
          )}

          {/* Common fields */}
          <div className="space-y-4 pt-2 border-t border-border">
            <Input
              label="Texto alternativo (alt) — Obligatorio por accesibilidad"
              value={newAlt}
              onChange={(e) => setNewAlt(e.target.value)}
              placeholder="Ej: Guía de montaña en los Pirineos de Andorra durante el atardecer"
              required
            />

            <Toggle
              label="Publicar inmediatamente en el sitio público"
              description="Si está activado, la diapositiva aparecerá visible de inmediato en el carrusel de inicio."
              checked={newPublished}
              onChange={setNewPublished}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              💾 Guardar diapositiva
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar Diapositiva Existente */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar diapositiva del Hero"
        description="Actualiza la información, el recurso o el estado de visibilidad."
        maxWidth="lg"
      >
        {slideBeingEdited && (
          <form onSubmit={handleUpdateSlide} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditSlideType('image')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  editSlideType === 'image'
                    ? 'bg-accent-soft text-accent-text border-accent/40 shadow-sm'
                    : 'bg-surface-elevated text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                <span>🖼️ Imagen</span>
              </button>
              <button
                type="button"
                onClick={() => setEditSlideType('video')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  editSlideType === 'video'
                    ? 'bg-accent-soft text-accent-text border-accent/40 shadow-sm'
                    : 'bg-surface-elevated text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                <span>🎬 Video</span>
              </button>
            </div>

            <Input
              label="Ruta o URL del recurso"
              value={editSrc}
              onChange={(e) => setEditSrc(e.target.value)}
              required
            />

            {editSlideType === 'video' && (
              <Input
                label="URL del póster (opcional)"
                value={editPoster}
                onChange={(e) => setEditPoster(e.target.value)}
                placeholder="https://..."
              />
            )}

            <Input
              label="Texto alternativo (alt)"
              value={editAlt}
              onChange={(e) => setEditAlt(e.target.value)}
              required
            />

            <Toggle
              label="Publicada en el sitio público"
              description="Controla si esta diapositiva está visible en el carrusel de la portada."
              checked={editPublished}
              onChange={setEditPublished}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
              >
                💾 Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRM DIALOG: Eliminar Diapositiva */}
      <ConfirmDialog
        isOpen={Boolean(slideToDelete)}
        onClose={() => setSlideToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar diapositiva?"
        message={`¿Estás seguro de que deseas eliminar la diapositiva '${slideToDelete?.alt}'? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
