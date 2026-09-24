import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Post, MediaItem, DashboardLocale } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Toggle } from '../ui/Toggle';
import { Badge } from '../ui/Badge';
import { ImagePickerModal } from '../media/ImagePickerModal';
import { SocialStatusBadge } from './SocialStatusBadge';
import { LanguageTabs } from '../ui/LanguageSelector';
import { AiTranslateButton } from '../ui/AiTranslateButton';
import { DEFAULT_SOCIAL_NETWORKS, type SocialNetworkItem } from '../content/SocialLinksSection';
import { PostReferenceChannelsSection } from './PostReferenceChannelsSection';

type NonEsLocale = 'ca' | 'en' | 'fr';

interface LocalePostData {
  title: string;
  body: string;
}

export const PostEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const [activeLocale, setActiveLocale] = useState<DashboardLocale>('es');

  // Base Spanish (ES) state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [publishFb, setPublishFb] = useState(false);
  const [publishIg, setPublishIg] = useState(false);

  // Translations (CA, EN, FR)
  const [translations, setTranslations] = useState<Record<NonEsLocale, LocalePostData>>({
    ca: { title: '', body: '' },
    en: { title: '', body: '' },
    fr: { title: '', body: '' },
  });

  const [existingPost, setExistingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      const loadPost = async () => {
        try {
          setLoading(true);
          const post = await api.posts.get(id);
          setExistingPost(post);
          setTitle(post.title);
          setSlug(post.slug);
          setBody(post.body);
          setCoverMediaId(post.cover_media_id);
          setCoverImageUrl(post.cover_image_url || null);
          setIsPublished(post.status === 'published');

          if (Array.isArray(post.reference_channels)) {
            setSelectedRefChannels(post.reference_channels);
          }

          if (post.translations) {
            setTranslations({
              ca: { title: post.translations.ca?.title || '', body: post.translations.ca?.body || '' },
              en: { title: post.translations.en?.title || '', body: post.translations.en?.body || '' },
              fr: { title: post.translations.fr?.title || '', body: post.translations.fr?.body || '' },
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al cargar la publicación';
          toast.error(msg);
          navigate('/posts');
        } finally {
          setLoading(false);
        }
      };
      loadPost();
    }
  }, [id, isEdit, navigate, toast]);

  // Social networks for reference channels
  const [socialNetworks, setSocialNetworks] = useState<SocialNetworkItem[]>([]);
  const [selectedRefChannels, setSelectedRefChannels] = useState<string[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(false);

  useEffect(() => {
    const loadSocialNetworks = async () => {
      try {
        setIsContentLoading(true);
        const res = await api.content.list();
        const content = res?.base || res?.content || {};
        const jsonStr = content.social_links_json;
        let parsed: SocialNetworkItem[] = [];

        if (jsonStr) {
          try {
            const json = JSON.parse(jsonStr);
            if (Array.isArray(json) && json.length > 0) {
              parsed = json;
            }
          } catch {
            // Fallback to legacy
          }
        }

        if (parsed.length === 0) {
          parsed = DEFAULT_SOCIAL_NETWORKS.map((item) => {
            const legacyKey = `social_${item.id}`;
            return {
              ...item,
              url: content[legacyKey] !== undefined ? content[legacyKey] : item.url,
            };
          });
        }

        // Filter out auto-publish networks (Facebook & Instagram)
        const refChannels = parsed.filter(
          (net) => net.id !== 'facebook' && net.id !== 'instagram' && !net.is_auto_publish
        );

        setSocialNetworks(refChannels);

        // If creating a new post (not edit), default select all active ref channels with valid URL
        if (!isEdit && selectedRefChannels.length === 0) {
          setSelectedRefChannels(refChannels.filter((net) => net.url && net.url.trim() !== '').map((net) => net.id));
        }
      } catch (err: unknown) {
        console.error('Error al cargar redes sociales para difusión:', err);
      } finally {
        setIsContentLoading(false);
      }
    };

    loadSocialNetworks();
  }, [id, isEdit]);

  const handleSelectImage = (item: MediaItem) => {
    setCoverMediaId(item.id);
    setCoverImageUrl(item.url);
    toast.success(`Foto '${item.original_name}' asignada como portada.`);
  };

  const handleRemoveImage = () => {
    setCoverMediaId(null);
    setCoverImageUrl(null);
  };

  const updateTranslationField = (locale: NonEsLocale, field: 'title' | 'body', val: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: val,
      },
    }));
  };

  const hasTranslationForLocale = (loc: DashboardLocale): boolean => {
    if (loc === 'es') return Boolean(title.trim() && body.trim());
    const t = translations[loc as NonEsLocale];
    return Boolean(t?.title?.trim() || t?.body?.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('El título y el contenido (en Español) son obligatorios.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        body: body.trim(),
        cover_media_id: coverMediaId,
        status: (isPublished ? 'published' : 'draft') as 'draft' | 'published',
        publish_to_facebook: publishFb,
        publish_to_instagram: publishIg,
        reference_channels: selectedRefChannels,
        translations,
      };

      if (isEdit && id) {
        await api.posts.update(Number(id), payload);
        toast.success('Publicación actualizada con éxito.', 'Guardado');
      } else {
        await api.posts.create(payload);
        toast.success('Publicación creada con éxito.', 'Post publicado');
      }
      navigate('/posts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el post';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando publicación...</p>
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
          <Link to="/posts">
            <Button variant="ghost" size="sm" type="button">
              ← Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {isEdit ? 'Editar Publicación' : 'Nueva Publicación'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isEdit ? 'Modifica los detalles del post o reintenta redes.' : 'Crea una noticia para el sitio y redes sociales.'}
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
            💾 {isPublished ? 'Guardar y Publicar' : 'Guardar Borrador'}
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
            {isEs ? 'Español es el idioma base obligatorio.' : 'Traducción de noticias con fallback a español.'}
          </span>
        </div>
        <LanguageTabs
          activeLocale={activeLocale}
          onChangeLocale={setActiveLocale}
          hasTranslation={hasTranslationForLocale}
        />
      </div>

      {/* Main Form Fields */}
      <Card
        title="Contenido de la Noticia"
        subtitle={isEs ? 'Título, texto y foto principal' : `Traducción de la noticia para ${activeLocale.toUpperCase()}`}
      >
        <div className="space-y-5">
          {isEs ? (
            <>
              <Input
                label="Título de la publicación (Español - Principal)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Nuevas rutas de Enduro habilitadas para esta temporada"
                required
              />

              <Textarea
                label="Contenido del post (Español - Principal)"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe aquí las novedades, detalles o anuncios para los clientes..."
                required
              />

              {/* Cover Media Selector (Shared) */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Foto de portada (opcional)
                </label>

                {coverImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-bg p-3 flex items-center gap-4">
                    <img
                      src={coverImageUrl}
                      alt="Portada seleccionada"
                      className="w-24 h-24 rounded-xl object-cover border border-border flex-shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-primary truncate">Foto asignada</p>
                      <p className="text-[11px] text-muted">Esta imagen se mostrará en el blog y en Instagram.</p>
                      <div className="flex gap-2 pt-2">
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
                          onClick={handleRemoveImage}
                          className="text-danger-text hover:text-danger"
                        >
                          Quitar
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
              </div>
            </>
          ) : (
            currentNonEs && (
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Título en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={title}
                      targetLocale={activeLocale}
                      fieldName="Título de la noticia"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'title', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {title || '(vacío)'}</p>
                  <Input
                    value={translations[currentNonEs].title}
                    onChange={(e) => updateTranslationField(currentNonEs, 'title', e.target.value)}
                    placeholder={`Título traducido (${activeLocale.toUpperCase()})...`}
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
                      Contenido del post en {activeLocale.toUpperCase()}
                    </label>
                    <AiTranslateButton
                      sourceText={body}
                      targetLocale={activeLocale}
                      fieldName="Cuerpo del post"
                      onTranslated={(val) => updateTranslationField(currentNonEs, 'body', val)}
                    />
                  </div>
                  <p className="text-xs text-muted italic">Base (ES): {body || '(vacío)'}</p>
                  <Textarea
                    rows={8}
                    value={translations[currentNonEs].body}
                    onChange={(e) => updateTranslationField(currentNonEs, 'body', e.target.value)}
                    placeholder={`Cuerpo de la noticia traducido (${activeLocale.toUpperCase()})...`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Publishing & Social Network Options (Only in ES mode) */}
      {isEs && (
        <Card title="Opciones de Publicación y Redes" subtitle="Control de visibilidad y sincronización con Meta">
          <div className="space-y-6">
            <Toggle
              label="Publicar en el sitio web de iWE"
              description="Si está activado, la publicación será visible de inmediato para los visitantes del sitio."
              checked={isPublished}
              onChange={setIsPublished}
            />

            <div className="pt-4 border-t border-border/80 space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Sincronización con Redes Sociales (Meta Graph API)
              </h4>
              <p className="text-xs text-muted">
                Al guardar, se enviará automáticamente a las cuentas conectadas de iWE:
              </p>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border cursor-pointer hover:border-border-strong transition-colors">
                  <input
                    type="checkbox"
                    checked={publishFb}
                    onChange={(e) => setPublishFb(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface border-border-strong"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary block">📘 Publicar en la Página de Facebook</span>
                      <Badge variant="success" size="sm">Auto-Publicación Directa</Badge>
                    </div>
                    <span className="text-xs text-muted">Publicará el texto y la foto en el feed oficial de Facebook.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border cursor-pointer hover:border-border-strong transition-colors">
                  <input
                    type="checkbox"
                    checked={publishIg}
                    onChange={(e) => setPublishIg(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface border-border-strong"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary block">📸 Publicar en Instagram Business</span>
                      <Badge variant="success" size="sm">Auto-Publicación Directa</Badge>
                    </div>
                    <span className="text-xs text-muted">Requiere una foto de portada seleccionada.</span>
                  </div>
                </label>
              </div>

              {/* Dynamic Reference Broadcast Channels Section */}
              <PostReferenceChannelsSection
                socialNetworks={socialNetworks}
                selectedRefChannels={selectedRefChannels}
                isContentLoading={isContentLoading}
                onToggleChannel={(netId, checked) => {
                  if (checked) {
                    setSelectedRefChannels((prev) => [...prev, netId]);
                  } else {
                    setSelectedRefChannels((prev) => prev.filter((item) => item !== netId));
                  }
                }}
              />

              {existingPost?.social_links && existingPost.social_links.length > 0 && (
                <div className="pt-3">
                  <p className="text-xs text-muted mb-2">Estado actual de sincronización previa:</p>
                  <SocialStatusBadge links={existingPost.social_links} />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectImage={handleSelectImage}
        selectedImageUrl={coverImageUrl || undefined}
      />
    </form>
  );
};
