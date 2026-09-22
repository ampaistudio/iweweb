import React from 'react';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';
import { useMenuManagerState } from './useMenuManagerState';
import { MenuTreeList } from './MenuTreeList';
import { MenuEditorModal } from './MenuEditorModal';

export const MenuManagerPage: React.FC = () => {
  const {
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
  } = useMenuManagerState();

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
      <MenuTreeList
        filteredTree={filteredTree}
        loading={loading}
        isReordering={isReordering}
        onRefresh={loadMenu}
        onCreateRoot={() => handleOpenCreate(null)}
        onCreateSubitem={(parentId) => handleOpenCreate(parentId)}
        onEdit={handleOpenEdit}
        onTogglePublish={handleTogglePublish}
        onDelete={(item) => setItemToDelete(item)}
        onMoveOrder={handleMoveOrder}
      />

      {/* Create / Edit Modal */}
      <MenuEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        formLocale={formLocale}
        setFormLocale={setFormLocale}
        isSaving={isSaving}
        parentOptions={parentOptions}
        onSubmit={handleSaveItem}
      />

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
