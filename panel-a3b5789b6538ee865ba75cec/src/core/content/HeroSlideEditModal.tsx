import React from 'react';
import type { HeroSlideItem } from '../../api/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';

export interface HeroSlideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideBeingEdited: HeroSlideItem | null;
  editSlideType: 'image' | 'video';
  setEditSlideType: (type: 'image' | 'video') => void;
  editSrc: string;
  setEditSrc: (src: string) => void;
  editPoster: string;
  setEditPoster: (poster: string) => void;
  editAlt: string;
  setEditAlt: (alt: string) => void;
  editPublished: boolean;
  setEditPublished: (published: boolean) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const HeroSlideEditModal: React.FC<HeroSlideEditModalProps> = ({
  isOpen,
  onClose,
  slideBeingEdited,
  editSlideType,
  setEditSlideType,
  editSrc,
  setEditSrc,
  editPoster,
  setEditPoster,
  editAlt,
  setEditAlt,
  editPublished,
  setEditPublished,
  isSaving,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar diapositiva del Hero"
      description="Actualiza la información, el recurso o el estado de visibilidad."
      maxWidth="lg"
    >
      {slideBeingEdited && (
        <form onSubmit={onSubmit} className="space-y-5">
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
              💾 Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

