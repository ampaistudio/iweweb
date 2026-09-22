import React from 'react';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { ConfirmDialog } from '../core/ui/ConfirmDialog';
import { usePackageListState } from './usePackageListState';
import { PackageTableList } from './PackageTableList';
import { PackageEditorModal } from './PackageEditorModal';

export const PackageListPage: React.FC = () => {
  const {
    packages,
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
  } = usePackageListState();

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

      {/* Packages Table List */}
      <PackageTableList
        packages={packages}
        filteredPackages={filteredPackages}
        loading={loading}
        isReordering={isReordering}
        onRefresh={loadPackages}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onTogglePublish={handleTogglePublish}
        onDelete={(pkg) => setPackageToDelete(pkg)}
        onMoveOrder={handleMoveOrder}
      />

      {/* Create / Edit Package Modal */}
      <PackageEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPackage={editingPackage}
        formData={formData}
        setFormData={setFormData}
        formLocale={formLocale}
        setFormLocale={setFormLocale}
        isSaving={isSaving}
        pickerOpen={pickerOpen}
        setPickerOpen={setPickerOpen}
        onTitleChange={handleTitleChange}
        onSelectImage={handleSelectImage}
        onSubmit={handleSavePackage}
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
