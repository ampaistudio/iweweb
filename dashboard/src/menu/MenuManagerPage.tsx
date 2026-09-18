import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api/client';
import type {
  MenuItem,
  MenuItemPayload,
  MenuLinkType,
  DashboardLocale,
} from '../api/types';

import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Badge } from '../core/ui/Badge';
import { Input } from '../core/ui/Input';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { Modal } from '../core/ui/Modal';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';

const LINK_TYPE_OPTIONS: Array<{ value: MenuLinkType; label: string }> = [
  { value: 'route', label: 'Ruta Interna (ej: /privacidad)' },
  { value: 'activity', label: 'Actividad de Turismo (Slug: ebike-arcalis)' },
  { value: 'package', label: 'Paquete Multidía (Slug: andorra-holiday-8d)' },
  { value: 'anchor', label: 'Ancla en Página (ej: /#viajes-medida)' },
  { value: 'external', label: 'Enlace Externo (ej: https://...)' },
];

type NonEsLocale = 'ca' | 'en' | 'fr';

interface FormState {
  id?: number;
  parent_id: number | null;
  label: string;
  link_type: MenuLinkType;
  target_value: string;
  published: boolean;
  publish_at: string;
  unpublish_at: string;
  translations: {
    ca: { label: string };
    en: { label: string };
    fr: { label: string };
  };
}

const INITIAL_FORM_STATE: FormState = {
  parent_id: null,
  label: '',
  link_type: 'route',
  target_value: '/',
  published: true,
  publish_at: '',
  unpublish_at: '',
  translations: {
    ca: { label: '' },
    en: { label: '' },
    fr: { label: '' },
  },
};


export const MenuManagerPage: React.FC = () => {
  const [treeItems, setTreeItems] = useState<MenuItem[]>([]);
  const [flatItems, setFlatItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [formLocale, setFormLocale] = useState<DashboardLocale>('es');
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder state
  const [isReordering, setIsReordering] = useState(false);

  const toast = useToast();

  const flattenTree = useCallback((items: MenuItem[]): MenuItem[] => {
    let result: MenuItem[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenTree(item.children));
      }
    }
    return result;
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.menu.list(true);
      setTreeItems(res || []);
      setFlatItems(flattenTree(res || []));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el menú de navegación';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [flattenTree, toast]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Compute descendants IDs of editing item to prevent circular parents
  const getDescendantIds = useCallback((itemId: number, allItems: MenuItem[]): Set<number> => {
    const descendants = new Set<number>();
    const findChildren = (pid: number) => {
      for (const item of allItems) {
        if (item.parent_id === pid) {
          descendants.add(item.id);
          findChildren(item.id);
        }
      }
    };
    findChildren(itemId);
    return descendants;
  }, []);

  // Filtered parent options for the select
  const parentOptions = useMemo(() => {
    const excludedIds = new Set<number>();
    if (editingItem) {
      excludedIds.add(editingItem.id);
      const desc = getDescendantIds(editingItem.id, flatItems);
      desc.forEach((id) => excludedIds.add(id));
    }

    const available = flatItems.filter((i) => !excludedIds.has(i.id));
    return [
      { value: '', label: '(Ninguno - Elemento principal en la raíz)' },
      ...available.map((i) => ({
        value: String(i.id),
        label: `${i.parent_id ? '  ↳ ' : ''}${i.label} (ID: ${i.id})`,
      })),
    ];
  }, [editingItem, flatItems, getDescendantIds]);

  const handleOpenCreate = (parentId?: number | null) => {
    setEditingItem(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      parent_id: parentId !== undefined ? parentId : null,
      translations: {
        ca: { label: '' },
        en: { label: '' },
        fr: { label: '' },
      },
    });
    setFormLocale('es');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: MenuItem) => {
    try {
      // Fetch full details with translations
      const full = await api.menu.get(item.id);
      setEditingItem(full);
      setFormData({
        id: full.id,
        parent_id: full.parent_id,
        label: full.label,
        link_type: full.link_type,
        target_value: full.target_value,
        published: Boolean(full.published),
        publish_at: full.publish_at ? full.publish_at.substring(0, 16).replace(' ', 'T') : '',
        unpublish_at: full.unpublish_at ? full.unpublish_at.substring(0, 16).replace(' ', 'T') : '',
        translations: {
          ca: { label: full.translations?.ca?.label || '' },
          en: { label: full.translations?.en?.label || '' },
          fr: { label: full.translations?.fr?.label || '' },
        },
      });
      setFormLocale('es');
      setIsModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar detalles del elemento';
      toast.error(msg);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      toast.error('El nombre / etiqueta del elemento (en Español) es obligatorio.');
      return;
    }
    if (!formData.target_value.trim()) {
      toast.error('El valor de destino (ruta, slug o enlace) es obligatorio.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: MenuItemPayload = {
        label: formData.label.trim(),
        link_type: formData.link_type,
        target_value: formData.target_value.trim(),
        parent_id: formData.parent_id,
        published: formData.published ? 1 : 0,
        publish_at: formData.publish_at ? formData.publish_at.replace('T', ' ') + ':00' : null,
        unpublish_at: formData.unpublish_at ? formData.unpublish_at.replace('T', ' ') + ':00' : null,
        translations: formData.translations,
      };

      if (editingItem && editingItem.id) {
        await api.menu.update(editingItem.id, payload);
        toast.success(`Elemento '${formData.label}' actualizado con éxito.`, 'Menú guardado');
      } else {
        await api.menu.create(payload);
        toast.success(`Elemento '${formData.label}' creado con éxito.`, 'Elemento creado');
      }

      setIsModalOpen(false);
      await loadMenu();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar elemento del menú';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (item: MenuItem) => {
    const updated = !item.published;
    try {
      await api.menu.update(item.id, {
        label: item.label,
        link_type: item.link_type,
        target_value: item.target_value,
        parent_id: item.parent_id,
        display_order: item.display_order,
        published: updated ? 1 : 0,
        publish_at: item.publish_at,
        unpublish_at: item.unpublish_at,
      });
      toast.success(
        `Elemento '${item.label}' ahora está ${updated ? 'Publicado' : 'Oculto'}.`,
        'Estado actualizado'
      );
      await loadMenu();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.menu.delete(itemToDelete.id);
      toast.success(`Elemento '${itemToDelete.label}' eliminado del menú.`, 'Elemento eliminado');
      setItemToDelete(null);
      await loadMenu();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar elemento';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder siblings
  const handleMoveOrder = async (
    siblings: MenuItem[],
    currentIndex: number,
    direction: 'up' | 'down'
  ) => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    setIsReordering(true);
    const newSiblings = [...siblings];
    const current = newSiblings[currentIndex];
    const target = newSiblings[targetIndex];

    // Swap
    newSiblings[currentIndex] = target;
    newSiblings[targetIndex] = current;

    // Generate batch reorder payload
    const batch = newSiblings.map((it, idx) => ({
      id: it.id,
      parent_id: it.parent_id,
      display_order: idx + 1,
    }));

    try {
      await api.menu.reorder(batch);
      toast.success('Orden de navegación actualizado.');
      await loadMenu();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar';
      toast.error(msg);
    } finally {
      setIsReordering(false);
    }
  };

  const getBadgeForLinkType = (type: MenuLinkType) => {
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

  // Helper for filter
  const matchesSearch = useCallback(
    (item: MenuItem): boolean => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSelf =
        item.label.toLowerCase().includes(q) ||
        item.target_value.toLowerCase().includes(q) ||
        item.link_type.toLowerCase().includes(q);
      const matchChildren = item.children?.some((c) => matchesSearch(c)) || false;
      return matchSelf || matchChildren;
    },
    [searchQuery]
  );

  const filteredTree = useMemo(() => {
    return treeItems.filter(matchesSearch);
  }, [treeItems, matchesSearch]);

  const totalPublished = flatItems.filter((i) => i.published).length;
  const totalScheduled = flatItems.filter((i) => i.publish_at || i.unpublish_at).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Menú de Navegación</h2>
          <p className="text-sm text-muted mt-1">
            Administra la estructura jerárquica del encabezado, enlaces a tours, paquetes multidía y programación temporal.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon="➕"
          onClick={() => handleOpenCreate(null)}
        >
          Crear elemento principal
        </Button>
      </div>

      {/* Stats and Search Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-bg text-secondary border border-border">
              Total: <strong className="text-primary">{flatItems.length}</strong>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-bg text-secondary border border-border">
              Secciones Raíz: <strong className="text-primary">{treeItems.length}</strong>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-bg text-accent-text border border-border">
              Publicados: <strong className="text-accent-text">{totalPublished}</strong>
            </span>
            {totalScheduled > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-elevated text-warning-text border border-border">
                Programados: <strong>{totalScheduled}</strong>
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el menú..."
              leftIcon="🔍"
            />
          </div>
        </div>
      </Card>

      {/* Navigation Tree Card */}
      <Card
        title="Estructura del Menú (Árbol Jerárquico)"
        subtitle="Organiza los niveles de navegación, el orden de aparición y los enlaces a contenido"
        action={
          <Button variant="ghost" size="sm" onClick={loadMenu} isLoading={loading}>
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
              <Button variant="secondary" size="sm" onClick={() => handleOpenCreate(null)}>
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
                          onClick={() => handleMoveOrder(filteredTree, rootIdx, 'up')}
                          disabled={isFirstRoot || isReordering}
                          className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[30px] min-w-[30px]"
                          title="Subir elemento"
                          aria-label="Subir en el orden"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(filteredTree, rootIdx, 'down')}
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
                        onClick={() => handleOpenCreate(rootItem.id)}
                        className="text-xs text-accent-text hover:bg-accent-soft"
                        title="Agregar subelemento dentro de esta categoría"
                      >
                        ➕ Subitem
                      </Button>

                      {/* Publish / Unpublish */}
                      <Button
                        variant={rootItem.published ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleTogglePublish(rootItem)}
                      >
                        {rootItem.published ? '👁️ Ocultar' : '✨ Publicar'}
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(rootItem)}
                      >
                        ✏️ Editar
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setItemToDelete(rootItem)}
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
                                  onClick={() => handleMoveOrder(children, childIdx, 'up')}
                                  disabled={isFirstChild || isReordering}
                                  className="p-1 text-muted hover:text-primary hover:bg-surface-hover rounded disabled:opacity-30 cursor-pointer min-h-[26px] min-w-[26px]"
                                  title="Subir subitem"
                                >
                                  ⬆️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveOrder(children, childIdx, 'down')}
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
                                onClick={() => handleTogglePublish(child)}
                              >
                                {child.published ? '👁️' : '✨'}
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEdit(child)}
                              >
                                ✏️
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setItemToDelete(child)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Editar Elemento: ${editingItem.label}` : 'Crear Elemento de Menú'}
        description="Define la etiqueta, el tipo de destino, la jerarquía y las traducciones multi-idioma."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-6">
          {/* Language Selector Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Idioma de Edición:
              </span>
              <span className="text-[11px] text-muted">
                {formLocale === 'es' ? 'Español es el idioma base.' : 'Traducciones para el menú.'}
              </span>
            </div>
            <LanguageTabs
              activeLocale={formLocale}
              onChangeLocale={setFormLocale}
              hasTranslation={(loc) => {
                if (loc === 'es') return Boolean(formData.label.trim());
                const l = formData.translations[loc as NonEsLocale]?.label;
                return Boolean(l && l.trim());
              }}
            />
          </div>

          {formLocale === 'es' ? (
            <>
              {/* Base Info (ES) */}
              <div className="space-y-4">
                <Input
                  label="Nombre / Etiqueta del Menú (Español)"
                  value={formData.label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Tours en Andorra, Raquetas de Nieve, etc."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de Enlace"
                    value={formData.link_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        link_type: e.target.value as MenuLinkType,
                      }))
                    }
                    options={LINK_TYPE_OPTIONS}
                    helperText="Define cómo navegará el usuario al hacer clic."
                  />

                  <Select
                    label="Elemento Padre (Jerarquía)"
                    value={formData.parent_id !== null ? String(formData.parent_id) : ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parent_id: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    options={parentOptions}
                    helperText="Selecciona una categoría padre o deja en la raíz."
                  />
                </div>

                <Input
                  label="Destino / Enlace / Slug"
                  value={formData.target_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, target_value: e.target.value }))
                  }
                  placeholder={
                    formData.link_type === 'route'
                      ? '/privacidad'
                      : formData.link_type === 'activity'
                      ? 'ebike-arcalis'
                      : formData.link_type === 'package'
                      ? 'andorra-holiday-8d'
                      : formData.link_type === 'anchor'
                      ? '/#viajes-medida'
                      : 'https://ejemplo.com'
                  }
                  helperText={
                    formData.link_type === 'activity'
                      ? 'Identificador slug de la actividad de turismo.'
                      : formData.link_type === 'package'
                      ? 'Identificador slug del paquete multidía.'
                      : formData.link_type === 'anchor'
                      ? 'Ruta con ancla de página.'
                      : 'Ruta o URL.'
                  }
                  required
                />
              </div>

              {/* Scheduling & Publication */}
              <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
                <Toggle
                  label="Publicado en el sitio web"
                  description="Si está desactivado, el elemento y sus subitems no aparecerán en el menú público."
                  checked={formData.published}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, published: checked }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      📅 Mostrar a partir de (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publish_at}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, publish_at: e.target.value }))
                      }
                      className="w-full bg-surface border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 min-h-[40px]"
                    />
                    <p className="text-[11px] text-muted mt-1">
                      Dejar vacío para mostrar inmediatamente.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      📅 Ocultar a partir de (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.unpublish_at}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, unpublish_at: e.target.value }))
                      }
                      className="w-full bg-surface border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:ring-2 min-h-[40px]"
                    />
                    <p className="text-[11px] text-muted mt-1">
                      Ideal para temporadas de verano o invierno.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Translation form for CA, EN, FR */
            <div className="space-y-4">
              <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                <span className="font-semibold text-primary block mb-1">Nombre base en Español:</span>
                <p className="italic font-medium">{formData.label || '(Sin nombre ingresado aún)'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                    Nombre en {formLocale.toUpperCase()}
                  </label>
                  <AiTranslateButton
                    sourceText={formData.label}
                    targetLocale={formLocale}
                    fieldName="Nombre del menú"
                    onTranslated={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [formLocale as NonEsLocale]: { label: val },
                        },
                      }))
                    }
                  />
                </div>
                <Input
                  value={formData.translations[formLocale as NonEsLocale]?.label || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [formLocale as NonEsLocale]: { label: val },
                      },
                    }));
                  }}
                  placeholder={`Etiqueta traducida (${formLocale.toUpperCase()})...`}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
            >
              💾 Guardar elemento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar elemento de menú?"
        message={
          itemToDelete
            ? `¿Estás seguro de que quieres eliminar '${itemToDelete.label}'? ${
                itemToDelete.children && itemToDelete.children.length > 0
                  ? 'ATENCIÓN: Este elemento contiene subelementos que quedarán huérfanos o serán eliminados.'
                  : ''
              }`
            : ''
        }
        confirmText="Sí, eliminar elemento"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
