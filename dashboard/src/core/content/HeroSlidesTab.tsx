import React from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useHeroSlidesState } from './useHeroSlidesState';
import { HeroSlidesList } from './HeroSlidesList';
import { HeroSlideAddModal } from './HeroSlideAddModal';
import { HeroSlideEditModal } from './HeroSlideEditModal';

export const HeroSlidesTab: React.FC = () => {
  const {
    slides,
    loading,
    isSaving,
    isReordering,
    addModalOpen,
    setAddModalOpen,
    addMode,
    setAddMode,
    editModalOpen,
    setEditModalOpen,
    slideBeingEdited,
    slideToDelete,
    setSlideToDelete,
    isDeleting,
    selectedFile,
    previewUrl,
    newSlideType,
    setNewSlideType,
    newSrc,
    setNewSrc,
    newPoster,
    setNewPoster,
    newAlt,
    setNewAlt,
    newPublished,
    setNewPublished,
    editSrc,
    setEditSrc,
    editPoster,
    setEditPoster,
    editAlt,
    setEditAlt,
    editPublished,
    setEditPublished,
    editSlideType,
    setEditSlideType,
    handleFileChange,
    handlePosterFileChange,
    handleOpenAddModal,
    handleCreateSlide,
    handleOpenEditModal,
    handleUpdateSlide,
    handleTogglePublish,
    handleMoveOrder,
    handleDeleteConfirm,
  } = useHeroSlidesState();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando diapositivas del carrusel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slides List & Top Banner */}
      <HeroSlidesList
        slides={slides}
        isReordering={isReordering}
        onOpenAddModal={handleOpenAddModal}
        onOpenEditModal={handleOpenEditModal}
        onTogglePublish={handleTogglePublish}
        onMoveOrder={handleMoveOrder}
        onDeleteClick={(slide) => setSlideToDelete(slide)}
      />

      {/* MODAL: Agregar Diapositiva Nueva */}
      <HeroSlideAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        addMode={addMode}
        setAddMode={setAddMode}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        newSlideType={newSlideType}
        setNewSlideType={setNewSlideType}
        newSrc={newSrc}
        setNewSrc={setNewSrc}
        newPoster={newPoster}
        setNewPoster={setNewPoster}
        newAlt={newAlt}
        setNewAlt={setNewAlt}
        newPublished={newPublished}
        setNewPublished={setNewPublished}
        isSaving={isSaving}
        onFileChange={handleFileChange}
        onPosterFileChange={handlePosterFileChange}
        onSubmit={handleCreateSlide}
        onSelectUploadMode={() => setAddMode('upload')}
        onSelectExternalMode={() => setAddMode('external')}
      />

      {/* MODAL: Editar Diapositiva Existente */}
      <HeroSlideEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slideBeingEdited={slideBeingEdited}
        editSlideType={editSlideType}
        setEditSlideType={setEditSlideType}
        editSrc={editSrc}
        setEditSrc={setEditSrc}
        editPoster={editPoster}
        setEditPoster={setEditPoster}
        editAlt={editAlt}
        setEditAlt={setEditAlt}
        editPublished={editPublished}
        setEditPublished={setEditPublished}
        isSaving={isSaving}
        onSubmit={handleUpdateSlide}
      />

      {/* CONFIRM DIALOG: Eliminar Diapositiva */}
      <ConfirmDialog
        isOpen={Boolean(slideToDelete)}
        onClose={() => setSlideToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar diapositiva?"
        message={`¿Estás seguro de que deseas eliminar la diapositiva '${slideToDelete?.alt}'? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
