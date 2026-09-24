import React from 'react';
import type { PackageItem } from '../api/types';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Badge } from '../core/ui/Badge';

import { formatPrice } from '../utils/formatters';

export interface PackageTableListProps {
  packages: PackageItem[];
  filteredPackages: PackageItem[];
  loading: boolean;
  isReordering: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (pkg: PackageItem) => void;
  onTogglePublish: (pkg: PackageItem) => void;
  onDelete: (pkg: PackageItem) => void;
  onMoveOrder: (currentIndex: number, direction: 'up' | 'down') => void;
}

export const PackageTableList: React.FC<PackageTableListProps> = ({
  packages,
  filteredPackages,
  loading,
  isReordering,
  onRefresh,
  onCreate,
  onEdit,
  onTogglePublish,
  onDelete,
  onMoveOrder,
}) => {
  return (
    <Card
      title="Catálogo de Paquetes"
      subtitle={`Mostrando ${filteredPackages.length} de ${packages.length} paquetes`}
      action={
        <Button variant="ghost" size="sm" onClick={onRefresh} isLoading={loading}>
          🔄 Actualizar
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando paquetes...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          <p className="text-2xl mb-2">🎒</p>
          <p>No se encontraron paquetes registrados.</p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onCreate}>
              Crear primer paquete
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPackages.map((pkg, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredPackages.length - 1;

            return (
              <div
                key={pkg.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  pkg.published
                    ? 'bg-surface/80 border-border hover:border-border-strong'
                    : 'bg-surface/40 border-border opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Image / Thumbnail */}
                  {pkg.image_url ? (
                    <img
                      src={pkg.image_url}
                      alt={pkg.alt_text || pkg.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border flex-shrink-0 bg-surface shadow-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-2xl flex-shrink-0">
                      🎒
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs bg-accent-soft text-accent-text border border-accent/30 px-2.5 py-0.5 rounded-md font-bold">
                        {pkg.duration}
                      </span>
                      <h4 className="text-base font-bold text-primary">{pkg.title}</h4>
                      <Badge
                        variant={
                          pkg.published
                            ? pkg.is_currently_visible
                              ? 'success'
                              : 'warning'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {pkg.published
                          ? pkg.is_currently_visible
                            ? 'Publicado'
                            : !pkg.menu_parent_id
                              ? 'Sin botón de menú'
                              : !pkg.group_published
                                ? 'Botón oculto'
                                : !pkg.menu_item_published
                                  ? 'Enlace oculto'
                                : 'Programado (Inactivo)'
                          : 'Oculto'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="font-mono bg-bg px-2 py-0.5 rounded border border-border/60">
                        Slug: {pkg.id}
                      </span>
                      {pkg.group_label && <span>Menú: {pkg.group_label}</span>}
                      {pkg.price_amount !== null && (
                        <span className="font-semibold text-accent-text">
                          💶 {formatPrice(pkg.price_amount, pkg.price_unit)}
                        </span>
                      )}
                      {pkg.publish_at && (
                        <span>📅 Inicio: {pkg.publish_at.substring(0, 16)}</span>
                      )}
                      {pkg.unpublish_at && (
                        <span>📅 Fin: {pkg.unpublish_at.substring(0, 16)}</span>
                      )}
                    </div>

                    <p className="text-xs text-muted line-clamp-2 max-w-3xl leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center pt-3 lg:pt-0 border-t lg:border-t-0 border-border/80 w-full lg:w-auto justify-end">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => onMoveOrder(index, 'up')}
                      disabled={isFirst || isReordering}
                      className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                      title="Subir paquete"
                      aria-label="Subir en el orden"
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveOrder(index, 'down')}
                      disabled={isLast || isReordering}
                      className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                      title="Bajar paquete"
                      aria-label="Bajar en el orden"
                    >
                      ⬇️
                    </button>
                  </div>

                  {/* Publish/Unpublish toggle button */}
                  <Button
                    variant={pkg.published ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => onTogglePublish(pkg)}
                    title={pkg.published ? 'Ocultar paquete' : 'Publicar paquete'}
                  >
                    {pkg.published ? '👁️ Ocultar' : '✨ Publicar'}
                  </Button>

                  {/* Edit button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(pkg)}
                  >
                    ✏️ Editar
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(pkg)}
                    className="text-danger-text hover:text-danger hover:bg-danger-soft"
                    title="Eliminar paquete"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
