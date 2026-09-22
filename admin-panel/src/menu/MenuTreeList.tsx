import React from 'react';
import type { MenuItem, MenuLinkType } from '../api/types';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Badge } from '../core/ui/Badge';

export interface MenuTreeListProps {
  filteredTree: MenuItem[];
  loading: boolean;
  isReordering: boolean;
  onRefresh: () => void;
  onCreateRoot: () => void;
  onCreateSubitem: (parentId: number) => void;
  onEdit: (item: MenuItem) => void;
  onTogglePublish: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onMoveOrder: (siblings: MenuItem[], currentIndex: number, direction: 'up' | 'down') => void;
}

export const getBadgeForLinkType = (type: MenuLinkType) => {
  switch (type) {
    case 'route':
      return <span className="text-[11px] bg-accent-soft text-accent-text border border-accent/30 px-2 py-0.5 rounded-md font-semibold">🌐 Ruta</span>;
    case 'activity':
      return <span className="text-[11px] bg-surface-elevated text-secondary border border-border px-2 py-0.5 rounded-md font-semibold">🏔️ Actividad</span>;
    case 'package':
      return <span className="text-[11px] bg-surface-elevated text-primary border border-border px-2 py-0.5 rounded-md font-semibold">🎒 Paquete</span>;
    case 'anchor':
      return <span className="text-[11px] bg-surface-hover text-muted border border-border px-2 py-0.5 rounded-md font-semibold">⚓ Ancla</span>;
    case 'external':
      return <span className="text-[11px] bg-surface-elevated text-faint border border-border px-2 py-0.5 rounded-md font-semibold">🔗 Enlace</span>;
    default:
      return <span className="text-[11px] bg-surface text-muted px-2 py-0.5 rounded-md">{type}</span>;
  }
};

export const MenuTreeList: React.FC<MenuTreeListProps> = ({
  filteredTree,
  loading,
  isReordering,
  onRefresh,
  onCreateRoot,
  onCreateSubitem,
  onEdit,
  onTogglePublish,
  onDelete,
  onMoveOrder,
}) => {
  return (
    <Card
      title="Estructura del Menú (Árbol Jerárquico)"
      subtitle="Organiza los niveles de navegación, el orden de aparición y los enlaces a contenido"
      action={
        <Button variant="ghost" size="sm" onClick={onRefresh} isLoading={loading}>
          🔄 Actualizar
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando árbol de navegación...</p>
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          <p className="text-2xl mb-2">📋</p>
          <p>No se encontraron elementos de menú.</p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onCreateRoot}>
              Crear primer elemento
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTree.map((rootItem, rootIdx) => {
            const isFirstRoot = rootIdx === 0;
            const isLastRoot = rootIdx === filteredTree.length - 1;
            const children = rootItem.children || [];

            return (
              <div
                key={rootItem.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  rootItem.published
                    ? 'bg-surface/80 border-border shadow-sm'
                    : 'bg-surface/40 border-border/60 opacity-80'
                }`}
              >
                {/* Root Node Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-elevated/40 border-b border-border/60">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-xl flex-shrink-0" title="Elemento Raíz">
                      📂
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-primary">{rootItem.label}</h4>
                        {getBadgeForLinkType(rootItem.link_type)}
                        <Badge
                          variant={
                            rootItem.published
                              ? rootItem.is_currently_visible
                                ? 'success'
                                : 'warning'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {rootItem.published
                            ? rootItem.is_currently_visible
                              ? 'Publicado'
                              : 'Programado (Inactivo)'
                            : 'Oculto'}
                        </Badge>
                        {children.length > 0 && (
                          <span className="text-xs bg-bg text-muted px-2 py-0.5 rounded-full border border-border">
                            {children.length} {children.length === 1 ? 'subitem' : 'subitems'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="font-mono bg-bg/80 px-2 py-0.5 rounded border border-border/80">
                          Destino: {rootItem.target_value}
                        </span>
                        {rootItem.publish_at && (
                          <span>📅 Desde: {rootItem.publish_at.substring(0, 16)}</span>
                        )}
                        {rootItem.unpublish_at && (
                          <span>📅 Hasta: {rootItem.unpublish_at.substring(0, 16)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Root Item */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onMoveOrder(filteredTree, rootIdx, 'up')}
                        disabled={isFirstRoot || isReordering}
                        className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[30px] min-w-[30px]"
                        title="Subir elemento"
                        aria-label="Subir en el orden"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveOrder(filteredTree, rootIdx, 'down')}
                        disabled={isLastRoot || isReordering}
                        className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[30px] min-w-[30px]"
                        title="Bajar elemento"
                        aria-label="Bajar en el orden"
                      >
                        ⬇️
                      </button>
                    </div>

                    {/* Add Subitem Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateSubitem(rootItem.id)}
                      className="text-xs text-accent-text hover:bg-accent-soft"
                      title="Agregar subelemento dentro de esta categoría"
                    >
                      ➕ Subitem
                    </Button>

                    {/* Publish / Unpublish */}
                    <Button
                      variant={rootItem.published ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onTogglePublish(rootItem)}
                    >
                      {rootItem.published ? '👁️ Ocultar' : '✨ Publicar'}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(rootItem)}
                    >
                      ✏️ Editar
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(rootItem)}
                      className="text-danger-text hover:text-danger hover:bg-danger-soft"
                      title="Eliminar elemento"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>

                {/* Children Sub-Tree */}
                {children.length > 0 && (
                  <div className="p-3 sm:p-4 space-y-2 bg-bg/40">
                    {children.map((child, childIdx) => {
                      const isFirstChild = childIdx === 0;
                      const isLastChild = childIdx === children.length - 1;

                      return (
                        <div
                          key={child.id}
                          className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ml-4 sm:ml-6 pl-4 relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:w-3 before:h-px before:bg-border transition-all ${
                            child.published
                              ? 'bg-surface border-border hover:border-border-strong'
                              : 'bg-surface/50 border-border/60 opacity-75'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-2.5">
                            <span className="text-sm text-muted">↳</span>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-primary">
                                  {child.label}
                                </span>
                                {getBadgeForLinkType(child.link_type)}
                                <Badge
                                  variant={
                                    child.published
                                      ? child.is_currently_visible
                                        ? 'success'
                                        : 'warning'
                                      : 'warning'
                                  }
                                  size="sm"
                                >
                                  {child.published
                                    ? child.is_currently_visible
                                      ? 'Publicado'
                                      : 'Programado'
                                    : 'Oculto'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                                <span className="font-mono bg-bg px-2 py-0.5 rounded border border-border/60">
                                  {child.target_value}
                                </span>
                                {child.publish_at && (
                                  <span>📅 {child.publish_at.substring(0, 16)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Subitem Actions */}
                          <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                            {/* Reorder Subitem */}
                            <div className="flex items-center gap-0.5 bg-surface-elevated border border-border rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => onMoveOrder(children, childIdx, 'up')}
                                disabled={isFirstChild || isReordering}
                                className="p-1 text-muted hover:text-primary hover:bg-surface-hover rounded disabled:opacity-30 cursor-pointer min-h-[26px] min-w-[26px]"
                                title="Subir subitem"
                              >
                                ⬆️
                              </button>
                              <button
                                type="button"
                                onClick={() => onMoveOrder(children, childIdx, 'down')}
                                disabled={isLastChild || isReordering}
                                className="p-1 text-muted hover:text-primary hover:bg-surface-hover rounded disabled:opacity-30 cursor-pointer min-h-[26px] min-w-[26px]"
                                title="Bajar subitem"
                              >
                                ⬇️
                              </button>
                            </div>

                            <Button
                              variant={child.published ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => onTogglePublish(child)}
                            >
                              {child.published ? '👁️' : '✨'}
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onEdit(child)}
                            >
                              ✏️
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(child)}
                              className="text-danger-text hover:text-danger hover:bg-danger-soft"
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
          })}
        </div>
      )}
    </Card>
  );
};

