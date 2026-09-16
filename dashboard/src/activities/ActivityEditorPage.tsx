import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ACTIVITY_TYPES, type Activity, type ActivityType } from './types';
import type { MediaItem } from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { Textarea } from '../core/ui/Textarea';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { ImagePickerModal } from '../core/media/ImagePickerModal';

export const ActivityEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const [title, setTitle] = useState('');
  const [slugId, setSlugId] = useState('');
  const [type, setType] = useState<ActivityType>('BTT');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Andorra');
  const [level, setLevel] = useState('Todos los niveles');
  const [duration, setDuration] = useState('4 horas');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [published, setPublished] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);

  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      const loadActivity = async () => {
        try {
          setLoading(true);
          const act = (await api.activities.get(id)) as Activity;
          setTitle(act.title);
          setSlugId(act.id);
          setType(act.type);
          setRegion(act.region);
          setCountry(act.country);
          setLevel(act.level);
          setDuration(act.duration);
          setPrice(act.price || '');
          setImageUrl(act.image_url || act.image);
          setAltText(act.alt_text || act.alt);
          setDescription(act.description);
          setHighlights(act.highlights && act.highlights.length > 0 ? act.highlights : ['']);
          setPublished(act.published);
          setDisplayOrder(act.display_order || 1);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al cargar la actividad';
          toast.error(msg);
          navigate('/activities');
        } finally {
          setLoading(false);
        }
      };
      loadActivity();
    }
  }, [id, isEdit, navigate, toast]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && !slugId) {
      // Auto suggest slug
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlugId(generated);
    }
  };

  const handleSelectImage = (item: MediaItem) => {
    setImageUrl(item.url);
    if (!altText) {
      setAltText(`Foto de ${title || 'actividad iWE'}`);
    }
    toast.success(`Foto '${item.original_name}' seleccionada.`);
  };

  const handleAddHighlight = () => {
    setHighlights((prev) => [...prev, '']);
  };

  const handleHighlightChange = (index: number, val: string) => {
    setHighlights((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El título de la actividad es obligatorio.');
      return;
    }
    if (!region.trim()) {
      toast.error('La región es obligatoria.');
      return;
    }
    if (!imageUrl.trim()) {
      toast.error('Debes seleccionar o ingresar una foto para la actividad.');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción de la actividad es obligatoria.');
      return;
    }

    setIsSaving(true);

    try {
      const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

      const payload = {
        id: slugId.trim() || undefined,
        title: title.trim(),
        region: region.trim(),
        country: country.trim(),
        type,
        level: level.trim(),
        duration: duration.trim(),
        price: price.trim() || null,
        image: imageUrl.trim(),
        image_url: imageUrl.trim(),
        alt: altText.trim() || `Experiencia de ${title}`,
        alt_text: altText.trim() || `Experiencia de ${title}`,
        description: description.trim(),
        highlights: cleanHighlights,
        published,
        display_order: Number(displayOrder) || 1,
      };

      if (isEdit && id) {
        await api.activities.update(id, payload);
        toast.success(`Actividad '${title}' actualizada con éxito.`, 'Guardado');
      } else {
        await api.activities.create(payload);
        toast.success(`Actividad '${title}' creada con éxito.`, 'Actividad creada');
      }
      navigate('/activities');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la actividad';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando datos de la actividad...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/activities">
            <Button variant="ghost" size="sm" type="button">
              ← Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isEdit ? 'Editar Actividad' : 'Nueva Actividad'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Completa los datos de la experiencia de montaña para el sitio público.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
          >
            💾 {published ? 'Guardar y Publicar' : 'Guardar Oculto'}
          </Button>
        </div>
      </div>

      {/* 1. Información Principal */}
      <Card title="Información Principal" subtitle="Nombre, categoría y ubicación">
        <div className="space-y-4">
          <Input
            label="Título de la actividad"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ej: E-Bike Enduro en Forn de Canillo"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría / Tipo de experiencia"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
              helperText="El sitio público agrupa los menús por esta categoría."
            />

            <Input
              label="Identificador URL (Slug)"
              value={slugId}
              onChange={(e) => setSlugId(e.target.value)}
              placeholder="ebike-forn-canillo"
              disabled={isEdit}
              helperText={isEdit ? 'El identificador no se puede modificar tras crearse.' : 'Se usa en el enlace /tour/:id'}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Región / Zona"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Ej: Canillo, Grandvalira, Pirineos"
              required
            />

            <Input
              label="País"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Andorra / España"
              required
            />
          </div>
        </div>
      </Card>

      {/* 2. Detalles de la Experiencia */}
      <Card title="Detalles del Recorrido" subtitle="Nivel, duración y precio">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nivel / Dificultad"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Principiante, Intermedio +, etc."
            required
          />

          <Input
            label="Duración"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="4 horas, Día completo, etc."
            required
          />

          <Input
            label="Precio (opcional)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="€85 por persona"
            helperText="Dejar vacío si no aplica precio fijo."
          />
        </div>
      </Card>

      {/* 3. Foto de la Actividad */}
      <Card title="Foto Principal" subtitle="Imagen de cabecera y accesibilidad">
        <div className="space-y-4">
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-4 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={imageUrl}
                alt={altText || 'Foto de actividad'}
                className="w-full sm:w-40 h-32 rounded-xl object-cover border border-stone-800 flex-shrink-0"
              />
              <div className="flex-1 space-y-2 w-full text-left">
                <p className="text-xs font-semibold text-stone-200">Foto asignada a la actividad</p>
                <p className="text-[11px] text-stone-400 break-all">{imageUrl}</p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    Cambiar foto
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Quitar foto
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPickerOpen(true)}
              leftIcon="📸"
              className="w-full justify-center py-6 border-dashed"
            >
              Elegir foto de la galería
            </Button>
          )}

          <Input
            label="Texto alternativo de la foto (accesibilidad)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Ej: Excursión en 4x4 por los caminos de alta montaña en Andorra"
            helperText="Describe la foto para lectores de pantalla y buscadores."
            required
          />
        </div>
      </Card>

      {/* 4. Descripción y Puntos Destacados */}
      <Card title="Descripción y Puntos Destacados" subtitle="Explicación detallada y lista de qué incluye">
        <div className="space-y-5">
          <Textarea
            label="Descripción completa"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Escribe el texto detallado de la ruta, el entorno y los atractivos de esta actividad..."
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                Puntos destacados / Qué incluye
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddHighlight}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                ➕ Agregar punto
              </Button>
            </div>

            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-mono w-5 text-right">{index + 1}.</span>
                  <input
                    type="text"
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, e.target.value)}
                    placeholder="Ej: Guía certificado por AADIDES/ISIA"
                    className="flex-1 bg-stone-950 border border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2"
                  />
                  {highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(index)}
                      className="p-2 text-stone-500 hover:text-rose-400 rounded-lg hover:bg-stone-900 transition-colors"
                      title="Eliminar este punto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Publicación y Estado */}
      <Card title="Estado de Publicación" subtitle="Control de visibilidad en el sitio web">
        <div className="space-y-4">
          <Toggle
            label="Publicado en el sitio web"
            description="Si está activado, la actividad aparecerá de inmediato en los menús y listados públicos."
            checked={published}
            onChange={setPublished}
          />
        </div>
      </Card>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Link to="/activities">
          <Button variant="secondary" size="lg" type="button">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
        >
          💾 Guardar actividad
        </Button>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImage={handleSelectImage}
        selectedImageUrl={imageUrl}
      />
    </form>
  );
};
