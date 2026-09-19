import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { ActivityTypeItem } from '../api/types';
import { Modal } from '../core/ui/Modal';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';
import { useToast } from '../core/ui/ToastContext';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: (categories: ActivityTypeItem[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated,
}) => {
  const [categories, setCategories] = useState<ActivityTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Deletion state
  const [deletingCategory, setDeletingCategory] = useState<ActivityTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.activityTypes.list();
      setCategories(res);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar categorías';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('El nombre de la categoría es obligatorio.');
      return;
    }

    try {
      setCreating(true);
      await api.activityTypes.create({ name });
      toast.success(`Categoría '${name}' creada exitosamente.`);
      setNewCategoryName('');
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la categoría';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (category: ActivityTypeItem) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async (id: number) => {
    const name = editingName.trim();
    if (!name) {
      toast.error('El nombre de la categoría no puede estar vacío.');
      return;
    }

    try {
      setUpdating(true);
      await api.activityTypes.update(id, { name });
      toast.success(`Categoría actualizada a '${name}'. Las actividades asociadas han sido actualizadas.`);
      setEditingId(null);
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar categoría';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;

    try {
      setIsDeleting(true);
      await api.activityTypes.delete(deletingCategory.id);
      toast.success(`Categoría '${deletingCategory.name}' eliminada correctamente.`);
      setDeletingCategory(null);
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar categoría';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);

    setCategories(newCategories);

    try {
      const payload = newCategories.map((cat, i) => ({
        id: cat.id,
        display_order: i + 1,
      }));
      await api.activityTypes.reorder(payload);
      if (onCategoriesUpdated) onCategoriesUpdated(newCategories);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar';
      toast.error(msg);
      await loadCategories();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="🏷️ Gestión de Categorías de Actividades"
        description="Agrega, renombra, reordena o elimina las categorías utilizadas en el catálogo de tours y experiencias."
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* New category form */}
          <form onSubmit={handleCreate} className="flex gap-2 items-end bg-surface-elevated/40 p-4 rounded-2xl border border-border">
            <div className="flex-1">
              <Input
                label="Nueva Categoría"
                placeholder="Ej: Barranquismo, Parapente, Kayak..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
              disabled={!newCategoryName.trim()}
              className="h-[42px]"
            >
              + Agregar
            </Button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Categorías Existentes ({categories.length})
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Cargando categorías...</p>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No hay categorías cargadas.</p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-surface">
                {categories.map((cat, index) => {
                  const isEditing = editingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-elevated/40 transition-colors"
                    >
                      {/* Left: Move buttons & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Order controls */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-xs text-muted hover:text-primary disabled:opacity-20 disabled:hover:text-muted cursor-pointer"
                            title="Mover arriba"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === categories.length - 1}
                            className="p-0.5 text-xs text-muted hover:text-primary disabled:opacity-20 disabled:hover:text-muted cursor-pointer"
                            title="Mover abajo"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Title or Input */}
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full bg-input border border-accent rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              isLoading={updating}
                              onClick={() => handleSaveEdit(cat.id)}
                            >
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="font-semibold text-sm text-primary">{cat.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-elevated text-secondary font-mono">
                              {cat.activities_count} {cat.activities_count === 1 ? 'actividad' : 'actividades'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Action buttons */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-xs text-secondary hover:text-primary rounded-lg hover:bg-surface-elevated transition-colors"
                            title="Editar nombre"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (cat.activities_count > 0) {
                                toast.error(`No puedes eliminar '${cat.name}' porque tiene ${cat.activities_count} actividades asociadas. Reasígnalas primero.`);
                                return;
                              }
                              setDeletingCategory(cat);
                            }}
                            className={`p-1.5 text-xs rounded-lg transition-colors ${
                              cat.activities_count > 0
                                ? 'text-muted/40 cursor-not-allowed'
                                : 'text-rose-500 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                            title={
                              cat.activities_count > 0
                                ? `Tiene ${cat.activities_count} actividades asociadas`
                                : 'Eliminar categoría'
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Double confirmation modal for category deletion */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        title={`¿Eliminar categoría '${deletingCategory?.name}'?`}
        message="Esta categoría no tiene actividades asignadas y será eliminada permanentemente del sistema."
        confirmText="Eliminar categoría"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
