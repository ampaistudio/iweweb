import React from 'react';
import type { HeroSlideItem } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface HeroSlidesListProps {
  slides: HeroSlideItem[];
  isReordering: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (slide: HeroSlideItem) => void;
  onTogglePublish: (slide: HeroSlideItem) => void;
  onMoveOrder: (index: number, direction: 'up' | 'down') => void;
  onDeleteClick: (slide: HeroSlideItem) => void;
}

export const HeroSlidesList: React.FC<HeroSlidesListProps> = ({
  slides,
  isReordering,
  onOpenAddModal,
  onOpenEditModal,
  onTogglePublish,
  onMoveOrder,
  onDeleteClick,
}) => {
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
          onClick={onOpenAddModal}
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
              onClick={onOpenAddModal}
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
                    onClick={() => onMoveOrder(index, 'up')}
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
                    onClick={() => onMoveOrder(index, 'down')}
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
                    onClick={() => onTogglePublish(slide)}
                    title={slide.published ? 'Ocultar del sitio público' : 'Publicar en el sitio público'}
                  >
                    {slide.published ? '👁️ Ocultar' : '✨ Publicar'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenEditModal(slide)}
                  >
                    ✏️ Editar
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteClick(slide)}
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
    </div>
  );
};

