import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ACTIVITY_TYPES, type Activity } from './types';
import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Badge } from '../core/ui/Badge';
import { Input } from '../core/ui/Input';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';

export const ActivityListPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await api.activities.list();
      setActivities((res as unknown) as Activity[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar actividades';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesType = selectedType === 'all' || act.type === selectedType;
      const matchesSearch =
        searchQuery === '' ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [activities, selectedType, searchQuery]);

  const handleTogglePublish = async (act: Activity) => {
    const updatedStatus = !act.published;
    try {
      await api.activities.update(act.id, {
        ...act,
        published: updatedStatus,
      });
      setActivities((prev) =>
        prev.map((item) => (item.id === act.id ? { ...item, published: updatedStatus } : item))
      );
      toast.success(
        `Actividad '${act.title}' ahora está ${updatedStatus ? 'Publicada' : 'Oculta (Borrador)'}.`,
        'Estado actualizado'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast.error(msg);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    setIsReordering(true);
    const newItems = [...activities];
    const current = newItems[index];
    const target = newItems[targetIndex];

    // Swap display_orders
    const tempOrder = current.display_order;
    current.display_order = target.display_order;
    target.display_order = tempOrder;

    newItems[index] = target;
    newItems[targetIndex] = current;

    // Sort by order
    newItems.sort((a, b) => a.display_order - b.display_order);
    setActivities(newItems);

    try {
      await Promise.all([
        api.activities.update(current.id, { ...current }),
        api.activities.update(target.id, { ...target }),
      ]);
      toast.success('Orden de actividades actualizado en el sitio público.');
    } catch {
      toast.error('Error al guardar el nuevo orden.');
      await loadActivities();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);

    try {
      await api.activities.delete(activityToDelete.id);
      setActivities((prev) => prev.filter((a) => a.id !== activityToDelete.id));
      toast.success(`Actividad '${activityToDelete.title}' eliminada.`, 'Actividad eliminada');
      setActivityToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar actividad';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (act: Activity) => {
    setDuplicatingId(act.id);
    try {
      const result = await api.activities.duplicate(act.id);
      toast.success(`Actividad duplicada como '${result.title}'. Editala para ajustar precio, duración, etc.`, 'Actividad duplicada');
      navigate(`/activities/${result.id}?promptMenu=1`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al duplicar actividad';
      toast.error(msg);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Actividades de Turismo</h2>
          <p className="text-sm text-muted mt-1">
            Administra los tours, experiencias de montaña, niveles de dificultad, precios y orden de visualización.
          </p>
        </div>
        <Link to="/activities/new">
          <Button variant="primary" size="md" leftIcon="➕">
            Crear nueva actividad
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Activity Types Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                selectedType === 'all'
                  ? 'bg-accent text-accent-text shadow-md'
                  : 'bg-bg text-muted hover:text-primary border border-border'
              }`}
            >
              Todas ({activities.length})
            </button>
            {ACTIVITY_TYPES.map((type) => {
              const count = activities.filter((a) => a.type === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                    selectedType === type
                      ? 'bg-accent text-accent-text shadow-md'
                      : 'bg-bg text-muted hover:text-primary border border-border'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="w-full md:w-72">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o región..."
              leftIcon="🔍"
            />
          </div>
        </div>
      </Card>

      {/* Activities List */}
      <Card
        title="Catálogo de Actividades"
        subtitle={`Mostrando ${filteredActivities.length} de ${activities.length} actividades`}
        action={
          <Button variant="ghost" size="sm" onClick={loadActivities} isLoading={loading}>
            🔄 Actualizar
          </Button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando actividades...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            <p className="text-2xl mb-2">🏔️</p>
            <p>No se encontraron actividades con los filtros actuales.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((act, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredActivities.length - 1;

              return (
                <div
                  key={act.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    act.published
                      ? 'bg-surface/80 border-border hover:border-border-strong/80'
                      : 'bg-surface/40 border-border opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <img
                      src={act.image_url || act.image}
                      alt={act.alt_text || act.alt}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border flex-shrink-0 bg-surface shadow-md"
                      loading="lazy"
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs bg-accent-soft text-accent-text border border-accent/30 px-2.5 py-0.5 rounded-md font-bold">
                          {act.type}
                        </span>
                        <h4 className="text-base font-bold text-primary">{act.title}</h4>
                        <Badge variant={act.published ? 'success' : 'warning'} size="sm">
                          {act.published ? 'Publicado' : 'Oculto'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span>📍 {act.region}, {act.country}</span>
                        <span>⏱️ {act.duration}</span>
                        <span>⚡ {act.level}</span>
                        {act.price && <span className="font-semibold text-accent-text">💶 {act.price}</span>}
                      </div>

                      <p className="text-xs text-muted line-clamp-2 max-w-3xl leading-relaxed">
                        {act.description}
                      </p>

                      {act.highlights && act.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {act.highlights.slice(0, 3).map((h, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-surface-elevated text-secondary border border-border px-2 py-0.5 rounded-md"
                            >
                              ✓ {h}
                            </span>
                          ))}
                          {act.highlights.length > 3 && (
                            <span className="text-[11px] text-muted py-0.5">
                              +{act.highlights.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Reordering */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center pt-3 lg:pt-0 border-t lg:border-t-0 border-border/80 w-full lg:w-auto justify-end">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={isFirst || isReordering}
                        className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                        title="Subir en la lista"
                        aria-label="Subir en el orden"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={isLast || isReordering}
                        className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                        title="Bajar en la lista"
                        aria-label="Bajar en el orden"
                      >
                        ⬇️
                      </button>
                    </div>

                    {/* Publish/Unpublish toggle button */}
                    <Button
                      variant={act.published ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleTogglePublish(act)}
                      title={act.published ? 'Ocultar del sitio web' : 'Publicar en el sitio web'}
                    >
                      {act.published ? '👁️ Ocultar' : '✨ Publicar'}
                    </Button>

                    {/* Edit button */}
                    <Link to={`/activities/${act.id}`}>
                      <Button variant="secondary" size="sm">
                        ✏️ Editar
                      </Button>
                    </Link>

                    {/* Duplicate button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDuplicate(act)}
                      isLoading={duplicatingId === act.id}
                      title="Duplicar actividad (copia todo el contenido y la galería)"
                    >
                      📋 Duplicar
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivityToDelete(act)}
                      className="text-danger-text hover:text-danger hover:bg-danger-soft"
                      title="Eliminar actividad"
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(activityToDelete)}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar esta actividad?"
        message={
          activityToDelete
            ? `¿Estás seguro de que quieres eliminar la actividad '${activityToDelete.title}'? Esta acción quitará la experiencia del sitio público y de la base de datos.`
            : ''
        }
        confirmText="Sí, eliminar actividad"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
