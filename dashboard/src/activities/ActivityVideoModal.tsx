import React from 'react';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';

interface ActivityVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoInputUrl: string;
  setVideoInputUrl: (url: string) => void;
  videoInputPoster: string;
  setVideoInputPoster: (poster: string) => void;
  videoInputAlt: string;
  setVideoInputAlt: (alt: string) => void;
  isVideoSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
}

export const ActivityVideoModal: React.FC<ActivityVideoModalProps> = ({
  isOpen,
  onClose,
  videoInputUrl,
  setVideoInputUrl,
  videoInputPoster,
  setVideoInputPoster,
  videoInputAlt,
  setVideoInputAlt,
  isVideoSubmitting,
  onSubmit,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            🎥 Agregar Video a la Galería
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary p-1 rounded"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="URL del Video (YouTube, Vimeo o enlace MP4)"
            value={videoInputUrl}
            onChange={(e) => setVideoInputUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
            helperText="Se reproducirá automáticamente en loop y silenciado en el hero del tour."
            required
          />

          <Input
            label="URL de Poster/Miniatura (Opcional)"
            value={videoInputPoster}
            onChange={(e) => setVideoInputPoster(e.target.value)}
            placeholder="https://..."
            helperText="Opcional. Imagen estática antes de que cargue el video."
          />

          <Input
            label="Texto descriptivo / Alt (Opcional)"
            value={videoInputAlt}
            onChange={(e) => setVideoInputAlt(e.target.value)}
            placeholder={`Video de ${title || 'la experiencia'}`}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isVideoSubmitting}
            >
              Agregar video
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
