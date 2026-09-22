import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api/client';
import type {
  MenuItem,
  MenuItemPayload,
  DashboardLocale,
} from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import {
  MenuFormState,
  INITIAL_MENU_FORM_STATE,
} from './menuTypes';

export function useMenuManagerState() {
  const [treeItems, setTreeItems] = useState<MenuItem[]>([]);
  const [flatItems, setFlatItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormState>(INITIAL_MENU_FORM_STATE);
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
      ...INITIAL_MENU_FORM_STATE,
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

    newSiblings[currentIndex] = target;
    newSiblings[targetIndex] = current;

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

  return {
    treeItems,
    flatItems,
    loading,
    searchQuery,
    setSearchQuery,
    filteredTree,
    totalPublished,
    totalScheduled,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    formData,
    setFormData,
    formLocale,
    setFormLocale,
    isSaving,
    itemToDelete,
    setItemToDelete,
    isDeleting,
    isReordering,
    parentOptions,
    loadMenu,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveItem,
    handleTogglePublish,
    handleDelete,
    handleMoveOrder,
  };
}

