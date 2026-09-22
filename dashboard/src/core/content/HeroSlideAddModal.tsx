import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';

export interface HeroSlideAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  addMode: 'upload' | 'external';
  setAddMode: (mode: 'upload' | 'external') => void;
  selectedFile: File | null;
  previewUrl: string | null;
  newSlideType: 'image' | 'video';
  setNewSlideType: (type: 'image' | 'video') => void;
  newSrc: string;
  setNewSrc: (src: string) => void;
  newPoster: string;
  setNewPoster: (poster: string) => void;
  newAlt: string;
  setNewAlt: (alt: string) => void;
  newPublished: boolean;
  setNewPublished: (published: boolean) => void;
  isSaving: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPosterFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectUploadMode: () => void;
  onSelectExternalMode: () => void;
}

export const HeroSlideAddModal: React.FC<HeroSlideAddModalProps> = ({
  isOpen,
  onClose,
  addMode,
  selectedFile,
  previewUrl,
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
  isSaving,
  onFileChange,
  onPosterFileChange,
  onSubmit,
  onSelectUploadMode,
  onSelectExternalMode,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar diapositiva al Hero"
      description="Sube una foto o video a tu hosting o enlaza contenido multimedia externo."
      maxWidth="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={onSelectUploadMode}
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
            onClick={onSelectExternalMode}
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
                  onChange={onFileChange}
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
                  onChange={onPosterFileChange}
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
            onClick={onClose}
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
  );
};

