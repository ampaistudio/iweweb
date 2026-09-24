import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import type {
  PackageItem,
  PackagePayload,
  MenuItem,
  DashboardLocale,
  MediaItem,
} from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import {
  PackageFormState,
  INITIAL_PACKAGE_FORM_STATE,
} from './packageTypes';

export function usePackageListState() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [menuGroups, setMenuGroups] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [formData, setFormData] = useState<PackageFormState>(INITIAL_PACKAGE_FORM_STATE);
  const [formLocale, setFormLocale] = useState<DashboardLocale>('es');
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'gallery'>('cover');

  // Delete state
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder state
  const [isReordering, setIsReordering] = useState(false);

  const toast = useToast();

  const loadPackages = async () => {
    try {
      setLoading(true);
      const [res, menu] = await Promise.all([
        api.packages.list({ includeUnpublished: true }),
        api.menu.list(true),
      ]);
      setPackages(res || []);
      setMenuGroups((menu || []).filter((item) => item.parent_id === null && item.link_type === 'anchor'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar paquetes';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return packages;
    const q = searchQuery.toLowerCase();
    return packages.filter(
      (pkg) =>
        pkg.title.toLowerCase().includes(q) ||
        pkg.id.toLowerCase().includes(q) ||
        pkg.duration.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q)
    );
  }, [packages, searchQuery]);

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setFormData(INITIAL_PACKAGE_FORM_STATE);
    setFormLocale('es');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (pkg: PackageItem) => {
    try {
      const full = await api.packages.get(pkg.id);
      setEditingPackage(full);
      setFormData({
        id: full.id,
        title: full.title,
        duration: full.duration,
        description: full.description,
        image_url: full.image_url || '',
        alt_text: full.alt_text || '',
        price_amount: full.price_amount !== null ? String(full.price_amount) : '',
        price_currency: full.price_currency || 'EUR',
        price_unit: full.price_unit || 'por persona',
        menu_parent_id: full.menu_parent_id ?? null,
        intro_title: full.intro_title || '',
        intro_text: full.intro_text || '',
        highlights: full.highlights || [],
        itinerary: full.itinerary || [],
        media: full.media || [],
        published: Boolean(full.published),
        publish_at: full.publish_at ? full.publish_at.substring(0, 16).replace(' ', 'T') : '',
        unpublish_at: full.unpublish_at ? full.unpublish_at.substring(0, 16).replace(' ', 'T') : '',
        translations: {
          ca: {
            title: full.translations?.ca?.title || '',
            description: full.translations?.ca?.description || '',
            price_unit: full.translations?.ca?.price_unit || '',
            intro_title: full.translations?.ca?.intro_title || '',
            intro_text: full.translations?.ca?.intro_text || '',
            highlights: full.translations?.ca?.highlights || [],
            itinerary: full.translations?.ca?.itinerary || [],
          },
          en: {
            title: full.translations?.en?.title || '',
            description: full.translations?.en?.description || '',
            price_unit: full.translations?.en?.price_unit || '',
            intro_title: full.translations?.en?.intro_title || '',
            intro_text: full.translations?.en?.intro_text || '',
            highlights: full.translations?.en?.highlights || [],
            itinerary: full.translations?.en?.itinerary || [],
          },
          fr: {
            title: full.translations?.fr?.title || '',
            description: full.translations?.fr?.description || '',
            price_unit: full.translations?.fr?.price_unit || '',
            intro_title: full.translations?.fr?.intro_title || '',
            intro_text: full.translations?.fr?.intro_text || '',
            highlights: full.translations?.fr?.highlights || [],
            itinerary: full.translations?.fr?.itinerary || [],
          },
        },
      });
      setFormLocale('es');
      setIsModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos del paquete';
      toast.error(msg);
    }
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      let slug = prev.id;
      if (!editingPackage && !slug) {
        slug = val
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return { ...prev, title: val, id: slug };
    });
  };

  const handleSelectImage = (item: MediaItem) => {
    if (pickerTarget === 'gallery') {
      setFormData((prev) => ({
        ...prev,
        media: [...prev.media, {
          media_type: 'image',
          media_url: item.url,
          alt_text: item.original_name,
          display_order: prev.media.length,
        }],
      }));
      toast.success(`Foto '${item.original_name}' agregada a la galería.`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      image_url: item.url,
      alt_text: prev.alt_text || `Foto de ${prev.title || 'paquete multidía'}`,
    }));
    toast.success(`Foto '${item.original_name}' seleccionada.`);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('El título del paquete (en Español) es obligatorio.');
      return;
    }
    if (!formData.duration.trim()) {
      toast.error('La duración es obligatoria (ej: 8 días / 7 noches).');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('La descripción del paquete es obligatoria.');
      return;
    }

    const cleanId = formData.id.trim().toLowerCase();
    if (!editingPackage && !cleanId) {
      toast.error('El identificador URL (slug) es obligatorio.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: PackagePayload = {
        id: !editingPackage ? cleanId : undefined,
        title: formData.title.trim(),
        duration: formData.duration.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim() || null,
        alt_text: formData.alt_text.trim() || null,
        price_amount: formData.price_amount ? parseFloat(formData.price_amount) : null,
        price_currency: formData.price_currency.trim().toUpperCase() || 'EUR',
        price_unit: formData.price_unit.trim() || null,
        menu_parent_id: formData.menu_parent_id,
        intro_title: formData.intro_title.trim() || null,
        intro_text: formData.intro_text.trim() || null,
        highlights: formData.highlights.map((item) => item.trim()).filter(Boolean),
        itinerary: formData.itinerary.map((item) => item.trim()).filter(Boolean),
        media: formData.media,
        published: formData.published ? 1 : 0,
        publish_at: formData.publish_at ? formData.publish_at.replace('T', ' ') + ':00' : null,
        unpublish_at: formData.unpublish_at ? formData.unpublish_at.replace('T', ' ') + ':00' : null,
        translations: formData.translations,
      };

      if (editingPackage) {
        await api.packages.update(editingPackage.id, payload);
        toast.success(`Paquete '${formData.title}' actualizado con éxito.`, 'Paquete guardado');
      } else {
        await api.packages.create(payload);
        toast.success(`Paquete '${formData.title}' creado con éxito.`, 'Paquete creado');
      }

      setIsModalOpen(false);
      await loadPackages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar paquete';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (pkg: PackageItem) => {
    const updated = !pkg.published;
    try {
      await api.packages.update(pkg.id, {
        title: pkg.title,
        duration: pkg.duration,
        description: pkg.description,
        image_url: pkg.image_url,
        alt_text: pkg.alt_text,
        price_amount: pkg.price_amount,
        price_currency: pkg.price_currency,
        price_unit: pkg.price_unit,
        display_order: pkg.display_order,
        published: updated ? 1 : 0,
        publish_at: pkg.publish_at,
        unpublish_at: pkg.unpublish_at,
      });
      toast.success(
        `Paquete '${pkg.title}' ahora está ${updated ? 'Publicado' : 'Oculto'}.`,
        'Estado actualizado'
      );
      await loadPackages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    try {
      await api.packages.delete(packageToDelete.id);
      toast.success(`Paquete '${packageToDelete.title}' eliminado.`, 'Paquete eliminado');
      setPackageToDelete(null);
      await loadPackages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar paquete';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= packages.length) return;

    setIsReordering(true);
    const newItems = [...packages];
    const current = newItems[currentIndex];
    const target = newItems[targetIndex];

    newItems[currentIndex] = target;
    newItems[targetIndex] = current;

    const batch = newItems.map((p, idx) => ({
      id: p.id,
      display_order: idx + 1,
    }));

    try {
      await api.packages.reorder(batch);
      toast.success('Orden de paquetes actualizado.');
      await loadPackages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar';
      toast.error(msg);
    } finally {
      setIsReordering(false);
    }
  };

  const totalPublished = packages.filter((p) => p.published).length;
  const totalScheduled = packages.filter((p) => p.publish_at || p.unpublish_at).length;

  return {
    packages,
    menuGroups,
    loading,
    searchQuery,
    setSearchQuery,
    filteredPackages,
    totalPublished,
    totalScheduled,
    isModalOpen,
    setIsModalOpen,
    editingPackage,
    formData,
    setFormData,
    formLocale,
    setFormLocale,
    isSaving,
    pickerOpen,
    setPickerOpen,
    pickerTarget,
    setPickerTarget,
    packageToDelete,
    setPackageToDelete,
    isDeleting,
    isReordering,
    loadPackages,
    handleOpenCreate,
    handleOpenEdit,
    handleTitleChange,
    handleSelectImage,
    handleSavePackage,
    handleTogglePublish,
    handleDelete,
    handleMoveOrder,
  };
}
