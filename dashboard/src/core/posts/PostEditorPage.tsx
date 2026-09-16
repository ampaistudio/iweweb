import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Post, MediaItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Toggle } from '../ui/Toggle';
import { ImagePickerModal } from '../media/ImagePickerModal';
import { SocialStatusBadge } from './SocialStatusBadge';

export const PostEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [publishFb, setPublishFb] = useState(false);
  const [publishIg, setPublishIg] = useState(false);

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

  const handleSelectImage = (item: MediaItem) => {
    setCoverMediaId(item.id);
    setCoverImageUrl(item.url);
    toast.success(`Foto '${item.original_name}' asignada como portada.`);
  };

  const handleRemoveImage = () => {
    setCoverMediaId(null);
    setCoverImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('El título y el contenido son obligatorios.');
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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando publicación...</p>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isEdit ? 'Editar Publicación' : 'Nueva Publicación'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
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

      {/* Main Form Fields */}
      <Card title="Contenido de la Noticia" subtitle="Título, texto y foto principal">
        <div className="space-y-5">
          <Input
            label="Título de la publicación"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Nuevas rutas de Enduro habilitadas para esta temporada"
            required
          />

          <Textarea
            label="Contenido del post"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe aquí las novedades, detalles o anuncios para los clientes..."
            required
          />

          {/* Cover Media Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
              Foto de portada (opcional)
            </label>

            {coverImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-3 flex items-center gap-4">
                <img
                  src={coverImageUrl}
                  alt="Portada seleccionada"
                  className="w-24 h-24 rounded-xl object-cover border border-stone-800 flex-shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-stone-200 truncate">Foto asignada</p>
                  <p className="text-[11px] text-stone-500">Esta imagen se mostrará en el blog y en Instagram.</p>
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
                      className="text-rose-400 hover:text-rose-300"
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
        </div>
      </Card>

      {/* Publishing & Social Network Options */}
      <Card title="Opciones de Publicación y Redes" subtitle="Control de visibilidad y sincronización con Meta">
        <div className="space-y-6">
          <Toggle
            label="Publicar en el sitio web de iWE"
            description="Si está activado, la publicación será visible de inmediato para los visitantes del sitio."
            checked={isPublished}
            onChange={setIsPublished}
          />

          <div className="pt-4 border-t border-stone-800/80 space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Sincronización con Redes Sociales (Meta Graph API)
            </h4>
            <p className="text-xs text-stone-400">
              Al guardar, se enviará automáticamente a las cuentas conectadas de iWE:
            </p>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={publishFb}
                  onChange={(e) => setPublishFb(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-stone-900 border-stone-700"
                />
                <div>
                  <span className="text-sm font-medium text-stone-200 block">📘 Publicar en la Página de Facebook</span>
                  <span className="text-xs text-stone-400">Publicará el texto y la foto en el feed oficial de Facebook.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={publishIg}
                  onChange={(e) => setPublishIg(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-stone-900 border-stone-700"
                />
                <div>
                  <span className="text-sm font-medium text-stone-200 block">📸 Publicar en Instagram Business</span>
                  <span className="text-xs text-stone-400">Requiere una foto de portada seleccionada.</span>
                </div>
              </label>
            </div>

            {existingPost?.social_links && existingPost.social_links.length > 0 && (
              <div className="pt-3">
                <p className="text-xs text-stone-400 mb-2">Estado actual de sincronización previa:</p>
                <SocialStatusBadge links={existingPost.social_links} />
              </div>
            )}
          </div>
        </div>
      </Card>

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
