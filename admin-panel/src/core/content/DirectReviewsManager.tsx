import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { parseDirectReviews } from './contentTypes';

export interface DirectReviewsManagerProps {
  value?: string;
  onChange: (newJson: string) => void;
}

export const DirectReviewsManager: React.FC<DirectReviewsManagerProps> = ({
  value,
  onChange,
}) => {
  const reviews = parseDirectReviews(value);

  const handleAddReview = () => {
    const updated = [...reviews, { name: '', quote: '', rating: 5 }];
    onChange(JSON.stringify(updated));
  };

  const handleRemoveReview = (index: number) => {
    const updated = reviews.filter((_, i) => i !== index);
    onChange(JSON.stringify(updated));
  };

  const handleUpdateReview = (index: number, patch: Partial<{ name: string; quote: string; rating: number }>) => {
    const updated = reviews.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Gestionar Reseñas Directas (iWE)</p>
          <p className="text-xs text-muted">Añade o edita los testimonios de clientes guardados en el sistema.</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAddReview}
          leftIcon="➕"
        >
          Agregar reseña
        </Button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-muted italic">No hay reseñas directas configuradas.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((item, idx) => (
            <div key={idx} className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Reseña #{idx + 1}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveReview(idx)}
                  leftIcon="🗑️"
                  title="Eliminar esta reseña"
                >
                  Eliminar
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Nombre del cliente"
                    value={item.name || ''}
                    onChange={(e) => handleUpdateReview(idx, { name: e.target.value })}
                    placeholder="Ej. Joan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Calificación (1-5)</label>
                  <select
                    value={item.rating ?? 5}
                    onChange={(e) => handleUpdateReview(idx, { rating: parseInt(e.target.value, 10) || 5 })}
                    className="w-full h-10 px-3 py-2 text-sm bg-bg border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={5}>5 ★★★★★</option>
                    <option value={4}>4 ★★★★☆</option>
                    <option value={3}>3 ★★★☆☆</option>
                    <option value={2}>2 ★★☆☆☆</option>
                    <option value={1}>1 ★☆☆☆☆</option>
                  </select>
                </div>
              </div>
              <Textarea
                label="Texto de la reseña"
                rows={2}
                value={item.quote || ''}
                onChange={(e) => handleUpdateReview(idx, { quote: e.target.value })}
                placeholder="Escribe el testimonio del cliente..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
