import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { MenuItem } from '../api/types';
import { Modal } from '../core/ui/Modal';
import { Button } from '../core/ui/Button';
import { Select } from '../core/ui/Select';
import { useToast } from '../core/ui/ToastContext';

export interface AddToMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
}

/** Lists editable menu destinations at any depth, with their full path. */
function buildParentOptions(items: MenuItem[]): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const visit = (nodes: MenuItem[], path: string[]) => {
    for (const item of nodes) {
      const nextPath = [...path, item.label];
      if (item.link_type === 'route' || item.link_type === 'anchor' || item.link_type === 'external') {
        options.push({ value: String(item.id), label: nextPath.join(' > ') });
        visit(item.children || [], nextPath);
      }
    }
  };
  visit(items, []);
  return options;
}

export const AddToMenuModal: React.FC<AddToMenuModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activityTitle,
}) => {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const loadMenu = async () => {
      try {
        setLoading(true);
        const tree = await api.menu.list();
        const opts = buildParentOptions(tree);
        setOptions(opts);
        setSelectedParentId(opts[0]?.value || '');
      } catch {
        toast.error('No se pudo cargar el menú. Podés agregarla manualmente desde Gestión de Menú.');
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [isOpen, toast]);

  const handleAdd = async () => {
    if (!selectedParentId) return;
    setIsSaving(true);
    try {
      await api.menu.create({
        parent_id: Number(selectedParentId),
        label: activityTitle,
        link_type: 'activity',
        target_value: activityId,
        published: true,
      });
      toast.success(`'${activityTitle}' agregada al menú.`, 'Menú actualizado');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar la actividad al menú';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Agregar esta actividad al menú?"
      description={`'${activityTitle}' fue guardada. Elegí en qué sección del menú de navegación mostrarla, o cerrá esta ventana para agregarla más tarde desde Gestión de Menú.`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted text-sm">Cargando secciones del menú...</div>
        ) : options.length === 0 ? (
          <p className="text-sm text-muted py-4">
            No se encontraron secciones del menú donde agregarla. Podés crear un ítem manualmente desde Gestión de Menú.
          </p>
        ) : (
          <Select
            label="Sección del menú"
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            options={options}
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Más tarde
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAdd}
            isLoading={isSaving}
            disabled={loading || options.length === 0}
            className="w-full sm:w-auto"
          >
            Agregar al menú
          </Button>
        </div>
      </div>
    </Modal>
  );
};
