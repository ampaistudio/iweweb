import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ACTIVITY_TYPES, type Activity, type ActivityType } from './types';
import type { MediaItem, DashboardLocale } from '../api/types';
import { useToast } from '../core/ui/ToastContext';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';
import { Input } from '../core/ui/Input';
import { Textarea } from '../core/ui/Textarea';
import { Select } from '../core/ui/Select';
import { Toggle } from '../core/ui/Toggle';
import { ImagePickerModal } from '../core/media/ImagePickerModal';
import { LanguageTabs } from '../core/ui/LanguageSelector';
import { AiTranslateButton } from '../core/ui/AiTranslateButton';

type NonEsLocale = 'ca' | 'en' | 'fr';

interface LocaleActivityData {
  title: string;
  description: string;
  highlights: string[];
}

export const ActivityEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) state
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

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, LocaleActivityData>>({
    ca: { title: '', description: '', highlights: [] },
    en: { title: '', description: '', highlights: [] },
    fr: { title: '', description: '', highlights: [] },
  });

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

          if (act.translations) {
            setTranslations({
              ca: {
                title: act.translations.ca?.title || '',
                description: act.translations.ca?.description || '',
                highlights: act.translations.ca?.highlights || [],
              },
              en: {
                title: act.translations.en?.title || '',
                description: act.translations.en?.description || '',
                highlights: act.translations.en?.highlights || [],
              },
              fr: {
                title: act.translations.fr?.title || '',
                description: act.translations.fr?.description || '',
                highlights: act.translations.fr?.highlights || [],
              },
            });
          }
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
    // Also remove from translations
    setTranslations((prev) => {
      const copy = { ...prev };
      (['ca', 'en', 'fr'] as NonEsLocale[]).forEach((loc) => {
        copy[loc] = {
          ...copy[loc],
          highlights: (copy[loc].highlights || []).filter((_, i) => i !== index),
        };
      });
      return copy;
    });
  };

  const updateTranslationField = (locale: NonEsLocale, field: 'title' | 'description', val: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: val,
      },
    }));
  };

  const updateTranslationHighlight = (locale: NonEsLocale, index: number, val: string) => {
    setTranslations((prev) => {
      const currentList = [...(prev[locale].highlights || [])];
      while (currentList.length < highlights.length) {
        currentList.push('');
      }
      currentList[index] = val;
      return {
        ...prev,
        [locale]: {
          ...prev[locale],
          highlights: currentList,
        },
      };
    });
  };

  const hasTranslationForLocale = (loc: DashboardLocale): boolean => {
    if (loc === 'es') return Boolean(title.trim());
    const t = translations[loc as NonEsLocale];
    return Boolean(t?.title?.trim() || t?.description?.trim() || t?.highlights?.some((h) => h.trim()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El título de la actividad (en Español) es obligatorio.');
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
      toast.error('La descripción de la actividad (en Español) es obligatoria.');
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
        translations,
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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando datos de la actividad...</p>
      </div>
    );
  }

  const isEs = activeLocale === 'es';
  const currentNonEs = !isEs ? (activeLocale as NonEsLocale) : null;

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
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {isEdit ? 'Editar Actividad' : 'Nueva Actividad'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
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

      {/* Language Selector Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Idioma de edición:
          </span>
          <span className="text-[11px] text-muted">
            {isEs ? 'Español es el idioma base obligatorio.' : 'Las traducciones son opcionales con fallback a español.'}
          </span>
        </div>
        <LanguageTabs
          activeLocale={activeLocale}
          onChangeLocale={setActiveLocale}
          hasTranslation={hasTranslationForLocale}
        />
      </div>

      {/* 1. Información Principal */}
      <Card
        title="Información Principal"
        subtitle={isEs ? 'Nombre, categoría y ubicación' : `Traducción de título para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-4">
          {isEs ? (
            <>
              <Input
                label="Título de la actividad (Español - Principal)"
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
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-3">
                <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                  <span className="font-semibold text-primary block mb-1">Título base en Español:</span>
                  <p className="italic">{title || '(Sin título ingresado aún)'}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={title}
                      targetLocale={activeLocale}
                      fieldName="Título de la actividad"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'title', val)}
                    />
                  </div>
                  <Input
                    value={translations[currentNonEs].title}
                    onChange={(e) => updateTranslationField(currentNonEs, 'title', e.target.value)}
                    placeholder={`Título traducido (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* 2. Detalles de la Experiencia (Solo en modo ES ya que son datos no editoriales) */}
      {isEs && (
        <Card title="Detalles del Recorrido" subtitle="Nivel, duración y precio (compartidos)">
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
      )}

      {/* 3. Foto de la Actividad (Compartida) */}
      {isEs && (
        <Card title="Foto Principal" subtitle="Imagen de cabecera y accesibilidad">
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-4 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imageUrl}
                  alt={altText || 'Foto de actividad'}
                  className="w-full sm:w-40 h-32 rounded-xl object-cover border border-border flex-shrink-0"
                />
                <div className="flex-1 space-y-2 w-full text-left">
                  <p className="text-xs font-semibold text-primary">Foto asignada a la actividad</p>
                  <p className="text-[11px] text-muted break-all">{imageUrl}</p>
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
                      className="text-danger-text hover:text-danger"
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
      )}

      {/* 4. Descripción y Puntos Destacados */}
      <Card
        title="Descripción y Puntos Destacados"
        subtitle={isEs ? 'Explicación detallada y lista de qué incluye' : `Traducción de textos para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-6">
          {/* Descripción */}
          {isEs ? (
            <Textarea
              label="Descripción completa (Español - Principal)"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe el texto detallado de la ruta, el entorno y los atractivos de esta actividad..."
              required
            />
          ) : (
            currentNonEs && (
              <div className="space-y-3">
                <div className="p-3 bg-bg rounded-xl border border-border text-xs text-muted">
                  <span className="font-semibold text-primary block mb-1">Descripción base en Español:</span>
                  <p className="leading-relaxed whitespace-pre-line">{description || '(Sin descripción ingresada aún)'}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Descripción en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={description}
                      targetLocale={activeLocale}
                      fieldName="Descripción completa"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'description', val)}
                    />
                  </div>
                  <Textarea
                    rows={5}
                    value={translations[currentNonEs].description}
                    onChange={(e) => updateTranslationField(currentNonEs, 'description', e.target.value)}
                    placeholder={`Descripción traducida (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}

          {/* Highlights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                Puntos destacados / Qué incluye {isEs ? '' : `(${activeLocale.toUpperCase()})`}
              </label>
              {isEs && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddHighlight}
                  className="text-xs text-accent-text hover:text-accent"
                >
                  ➕ Agregar punto
                </Button>
              )}
            </div>

            {isEs ? (
              <div className="space-y-2">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-muted font-mono w-5 text-right">{index + 1}.</span>
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => handleHighlightChange(index, e.target.value)}
                      placeholder="Ej: Guía certificado por AADIDES/ISIA"
                      className="flex-1 bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                    />
                    {highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className="p-2 text-muted hover:text-danger rounded-lg hover:bg-surface-hover transition-colors"
                        title="Eliminar este punto"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              currentNonEs && (
                <div className="space-y-3">
                  {highlights.map((baseH, index) => (
                    <div key={index} className="p-3 bg-bg rounded-xl border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted font-semibold">Punto #{index + 1}:</span>
                        <AiTranslateButton
                          sourceText={baseH}
                          targetLocale={activeLocale}
                          fieldName={`Punto destacado #${index + 1}`}
                          onTranslated={(val) => updateTranslationHighlight(currentNonEs, index, val)}
                        />
                      </div>
                      <p className="text-xs text-muted italic">Base (ES): {baseH || '(vacío)'}</p>
                      <input
                        type="text"
                        value={translations[currentNonEs].highlights?.[index] || ''}
                        onChange={(e) => updateTranslationHighlight(currentNonEs, index, e.target.value)}
                        placeholder={`Traducción del punto #${index + 1}...`}
                        className="w-full bg-input border border-border focus:border-accent focus:ring-accent/20 rounded-xl px-3.5 py-2 text-sm text-primary placeholder-faint focus:outline-none focus:ring-2"
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </Card>

      {/* 5. Publicación y Estado (Solo en ES) */}
      {isEs && (
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
      )}

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
