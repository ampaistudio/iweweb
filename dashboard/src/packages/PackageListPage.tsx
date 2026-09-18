import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import type {
  PackageItem,
  PackagePayload,
  DashboardLocale,
  MediaItem,
} from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Badge } from '../core/ui/Badge';
import { Input } from '../core/ui/Input';
import { Textarea } from '../core/ui/Textarea';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { Modal } from '../core/ui/Modal';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';
import { ImagePickerModal } from '../core/media/ImagePickerModal';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';

type NonEsLocale = 'ca' | 'en' | 'fr';

interface FormState {
  id: string;
  title: string;
  duration: string;
  description: string;
  image_url: string;
  alt_text: string;
  price_amount: string;
  price_currency: string;
  price_unit: string;
  published: boolean;
  publish_at: string;
  unpublish_at: string;
  translations: {
    ca: { title: string; description: string; price_unit: string };
    en: { title: string; description: string; price_unit: string };
    fr: { title: string; description: string; price_unit: string };
  };
}

const INITIAL_FORM_STATE: FormState = {
  id: '',
  title: '',
  duration: '8 días / 7 noches',
  description: '',
  image_url: '',
  alt_text: '',
  price_amount: '',
  price_currency: 'EUR',
  price_unit: 'por persona',
  published: true,
  publish_at: '',
  unpublish_at: '',
  translations: {
    ca: { title: '', description: '', price_unit: '' },
    en: { title: '', description: '', price_unit: '' },
    fr: { title: '', description: '', price_unit: '' },
  },
};

export const PackageListPage: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [formLocale, setFormLocale] = useState<DashboardLocale>('es');
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Delete state
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder state
  const [isReordering, setIsReordering] = useState(false);

  const toast = useToast();

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await api.packages.list({ includeUnpublished: true });
      setPackages(res || []);
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
    setFormData(INITIAL_FORM_STATE);
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
        published: Boolean(full.published),
        publish_at: full.publish_at ? full.publish_at.substring(0, 16).replace(' ', 'T') : '',
        unpublish_at: full.unpublish_at ? full.unpublish_at.substring(0, 16).replace(' ', 'T') : '',
        translations: {
          ca: {
            title: full.translations?.ca?.title || '',
            description: full.translations?.ca?.description || '',
            price_unit: full.translations?.ca?.price_unit || '',
          },
          en: {
            title: full.translations?.en?.title || '',
            description: full.translations?.en?.description || '',
            price_unit: full.translations?.en?.price_unit || '',
          },
          fr: {
            title: full.translations?.fr?.title || '',
            description: full.translations?.fr?.description || '',
            price_unit: full.translations?.fr?.price_unit || '',
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Paquetes Multidía</h2>
          <p className="text-sm text-muted mt-1">
            Gestiona las vacaciones combinadas (ej: Andorra Holiday & Bike), precios estructurados, temporadas y traducciones.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon="➕"
          onClick={handleOpenCreate}
        >
          Crear nuevo paquete
        </Button>
      </div>

      {/* Stats and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-bg text-secondary border border-border">
              Total: <strong className="text-primary">{packages.length}</strong>
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

          <div className="w-full md:w-72">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paquete por título o duración..."
              leftIcon="🔍"
            />
          </div>
        </div>
      </Card>

      {/* Packages List */}
      <Card
        title="Catálogo de Paquetes"
        subtitle={`Mostrando ${filteredPackages.length} de ${packages.length} paquetes`}
        action={
          <Button variant="ghost" size="sm" onClick={loadPackages} isLoading={loading}>
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
              <Button variant="secondary" size="sm" onClick={handleOpenCreate}>
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
                              : 'Programado (Inactivo)'
                            : 'Oculto'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="font-mono bg-bg px-2 py-0.5 rounded border border-border/60">
                          Slug: {pkg.id}
                        </span>
                        {pkg.price_amount !== null && (
                          <span className="font-semibold text-accent-text">
                            💶 €{pkg.price_amount.toFixed(2)} {pkg.price_unit ? `(${pkg.price_unit})` : ''}
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
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={isFirst || isReordering}
                        className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                        title="Subir paquete"
                        aria-label="Subir en el orden"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
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
                      onClick={() => handleTogglePublish(pkg)}
                      title={pkg.published ? 'Ocultar paquete' : 'Publicar paquete'}
                    >
                      {pkg.published ? '👁️ Ocultar' : '✨ Publicar'}
                    </Button>

                    {/* Edit button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(pkg)}
                    >
                      ✏️ Editar
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPackageToDelete(pkg)}
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

      {/* Create / Edit Package Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? `Editar Paquete: ${editingPackage.title}` : 'Crear Paquete Multidía'}
        description="Configura el título, duración, descripción, precio y programación de visibilidad."
        maxWidth="2xl"
      >

        <form onSubmit={handleSavePackage} className="space-y-6">
          {/* Language Selector Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Idioma de Edición:
              </span>
              <span className="text-[11px] text-muted">
                {formLocale === 'es' ? 'Español es el idioma base obligatorio.' : 'Traducción para el paquete.'}
              </span>
            </div>
            <LanguageTabs
              activeLocale={formLocale}
              onChangeLocale={setFormLocale}
              hasTranslation={(loc) => {
                if (loc === 'es') return Boolean(formData.title.trim());
                const t = formData.translations[loc as NonEsLocale];
                return Boolean(t?.title?.trim() || t?.description?.trim());
              }}
            />
          </div>

          {formLocale === 'es' ? (
            <>
              {/* 1. Base Info */}
              <div className="space-y-4">
                <Input
                  label="Título del Paquete (Español)"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej: Andorra Holiday & Bike 8 Días / 7 Noches"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Identificador URL (Slug)"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    placeholder="andorra-holiday-8d"
                    disabled={Boolean(editingPackage)}
                    helperText={
                      editingPackage
                        ? 'El identificador no se puede modificar tras crearse.'
                        : 'Identificador único en minúsculas y guiones.'
                    }
                    required
                  />

                  <Input
                    label="Duración"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="8 días / 7 noches"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Monto de Precio (€)"
                    type="number"
                    step="0.01"
                    value={formData.price_amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price_amount: e.target.value }))
                    }
                    placeholder="639.00"
                    helperText="Número sin símbolo (ej: 639.00)"
                  />

                  <Select
                    label="Moneda"
                    value={formData.price_currency}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price_currency: e.target.value }))
                    }
                    options={[
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'USD', label: 'USD ($)' },
                    ]}
                  />

                  <Input
                    label="Unidad de Precio"
                    value={formData.price_unit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price_unit: e.target.value }))
                    }
                    placeholder="por persona"
                  />
                </div>
              </div>

              {/* 2. Photo */}
              <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    Foto Principal del Paquete
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    📸 Seleccionar foto
                  </Button>
                </div>

                {formData.image_url ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.image_url}
                      alt="Foto previa"
                      className="w-20 h-16 rounded-xl object-cover border border-border bg-surface"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium truncate">{formData.image_url}</p>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                        className="text-[11px] text-danger-text hover:text-danger mt-0.5"
                      >
                        Quitar foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Sin foto asignada todavía.</p>
                )}

                <Input
                  label="Texto alternativo (Alt Text)"
                  value={formData.alt_text}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
                  }
                  placeholder="Ej: Vacaciones de Mountain Bike y alojamiento en Andorra"
                />
              </div>

              {/* 3. Description */}
              <Textarea
                label="Descripción del Paquete (Español)"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe el itinerario, hoteles incluidos, actividades y traslados..."
                required
              />

              {/* 4. Publication & Schedule */}
              <div className="p-4 bg-bg rounded-2xl border border-border space-y-4">
                <Toggle
                  label="Publicado en el sitio web"
                  description="Si está desactivado, el paquete quedará como borrador y no aparecerá en el sitio público."
                  checked={formData.published}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, published: checked }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      📅 Fecha de Inicio de Publicación (opcional)
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
                      Ideal para activar automáticamente antes de temporada.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      📅 Fecha de Fin de Publicación (opcional)
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
                      Ideal para desactivar automáticamente al final de temporada.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Multi-language form */
            <div className="space-y-4">
              <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                <span className="font-semibold text-primary block mb-1">Título base (ES):</span>
                <p className="italic font-medium">{formData.title || '(Sin título ingresado aún)'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                    Título en {formLocale.toUpperCase()}
                  </label>
                  <AiTranslateButton
                    sourceText={formData.title}
                    targetLocale={formLocale}
                    fieldName="Título del paquete"
                    onTranslated={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [formLocale as NonEsLocale]: {
                            ...prev.translations[formLocale as NonEsLocale],
                            title: val,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <Input
                  value={formData.translations[formLocale as NonEsLocale]?.title || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [formLocale as NonEsLocale]: {
                          ...prev.translations[formLocale as NonEsLocale],
                          title: val,
                        },
                      },
                    }));
                  }}
                  placeholder={`Título traducido (${formLocale.toUpperCase()})...`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                    Descripción en {formLocale.toUpperCase()}
                  </label>
                  <AiTranslateButton
                    sourceText={formData.description}
                    targetLocale={formLocale}
                    fieldName="Descripción del paquete"
                    onTranslated={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [formLocale as NonEsLocale]: {
                            ...prev.translations[formLocale as NonEsLocale],
                            description: val,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <Textarea
                  rows={4}
                  value={formData.translations[formLocale as NonEsLocale]?.description || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [formLocale as NonEsLocale]: {
                          ...prev.translations[formLocale as NonEsLocale],
                          description: val,
                        },
                      },
                    }));
                  }}
                  placeholder={`Descripción traducida (${formLocale.toUpperCase()})...`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Unidad de Precio en {formLocale.toUpperCase()} (ej: per person / per persona)
                </label>
                <Input
                  value={formData.translations[formLocale as NonEsLocale]?.price_unit || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [formLocale as NonEsLocale]: {
                          ...prev.translations[formLocale as NonEsLocale],
                          price_unit: val,
                        },
                      },
                    }));
                  }}
                  placeholder="per person / per persona / par personne"
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
              💾 Guardar paquete
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Picker */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImage={handleSelectImage}
        selectedImageUrl={formData.image_url}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar este paquete?"
        message={
          packageToDelete
            ? `¿Estás seguro de que deseas eliminar el paquete '${packageToDelete.title}'? Esta acción quitará el paquete de la base de datos.`
            : ''
        }
        confirmText="Sí, eliminar paquete"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
