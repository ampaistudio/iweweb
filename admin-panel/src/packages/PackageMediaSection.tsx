import React, { useState } from 'react';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import type { PackageFormState } from './packageTypes';

interface PackageMediaSectionProps {
  formData: PackageFormState;
  setFormData: React.Dispatch<React.SetStateAction<PackageFormState>>;
  onOpenPicker: () => void;
}

export function PackageMediaSection({ formData, setFormData, onOpenPicker }: PackageMediaSectionProps) {
  const [videoUrl, setVideoUrl] = useState('');

  const moveMedia = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= formData.media.length) return;
    setFormData((prev) => {
      const media = [...prev.media];
      [media[index], media[nextIndex]] = [media[nextIndex], media[index]];
      return { ...prev, media };
    });
  };

  const addVideo = () => {
    const url = videoUrl.trim();
    if (!/^https?:\/\//i.test(url)) return;
    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, { media_type: 'video', media_url: url, alt_text: prev.title }],
    }));
    setVideoUrl('');
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">Galería del paquete</h3>
          <p className="text-xs text-muted">La foto principal aparece primero; agregá más fotos o videos para la ficha.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenPicker}>📷 Agregar foto</Button>
      </div>

      {formData.media.map((media, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
          {media.media_type === 'image' ? (
            <img src={media.media_url} alt={media.alt_text || ''} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-elevated">▶</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-primary">{media.media_url}</p>
            <Input
              label="Texto alternativo"
              value={media.alt_text || ''}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                media: prev.media.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, alt_text: e.target.value } : item
                ),
              }))}
            />
          </div>
          <div className="flex gap-1">
            <button type="button" disabled={index === 0} onClick={() => moveMedia(index, -1)} aria-label="Mover arriba" className="px-2 text-primary disabled:opacity-30">↑</button>
            <button type="button" disabled={index === formData.media.length - 1} onClick={() => moveMedia(index, 1)} aria-label="Mover abajo" className="px-2 text-primary disabled:opacity-30">↓</button>
            <button type="button" onClick={() => setFormData((prev) => ({
              ...prev, media: prev.media.filter((_, itemIndex) => itemIndex !== index),
            }))} aria-label="Quitar elemento" className="px-2 text-danger-text">×</button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Input label="URL de video (opcional)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addVideo} disabled={!/^https?:\/\//i.test(videoUrl.trim())}>🎥 Agregar video</Button>
      </div>
    </div>
  );
}
