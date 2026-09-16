import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Post } from '../../api/types';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SocialStatusBadge } from './SocialStatusBadge';

export const PostsListPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryingPostId, setRetryingPostId] = useState<number | null>(null);

  const toast = useToast();

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await api.posts.list();
      setPosts(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar novedades';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    try {
      await api.posts.delete(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      toast.success(`Publicación '${postToDelete.title}' eliminada.`, 'Post eliminado');
      setPostToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el post';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetrySocial = async (postId: number, platform: 'facebook' | 'instagram') => {
    setRetryingPostId(postId);
    try {
      await api.posts.update(postId, {
        retry_platform: platform,
      });
      toast.success(`Reintento de publicación enviado a ${platform}.`, 'Sincronización disparada');
      // Reload posts to update status
      await loadPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reintentar';
      toast.error(msg);
    } finally {
      setRetryingPostId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Novedades y Blog</h2>
          <p className="text-sm text-muted mt-1">
            Gestiona las noticias del sitio y su sincronización automática con Facebook e Instagram.
          </p>
        </div>
        <Link to="/posts/new">
          <Button variant="primary" size="md" leftIcon="✍️">
            Crear nuevo post
          </Button>
        </Link>
      </div>

      {/* Posts Table / List */}
      <Card
        title="Listado de Publicaciones"
        subtitle={`Total: ${posts.length} posts`}
        action={
          <Button variant="ghost" size="sm" onClick={loadPosts} isLoading={loading}>
            🔄 Actualizar
          </Button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            <p className="text-2xl mb-2">📢</p>
            <p>No hay publicaciones creadas todavía.</p>
            <Link to="/posts/new" className="inline-block mt-3">
              <Button variant="primary" size="sm">
                Crear la primera publicación
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isPublished = post.status === 'published';
              const isWeb = post.origin === 'web';

              return (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border hover:border-border-strong/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Cover thumbnail */}
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xl flex-shrink-0 text-muted">
                        📄
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-primary">{post.title}</h4>
                        <Badge variant={isPublished ? 'success' : 'warning'} size="sm">
                          {isPublished ? 'Publicado' : 'Borrador'}
                        </Badge>
                        {!isWeb && (
                          <span className="text-[11px] bg-info-soft text-info-text border border-info-text/30 px-2 py-0.5 rounded-md font-medium">
                            {post.origin === 'instagram' ? '📸 De Instagram' : '📘 De Facebook'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted line-clamp-2 max-w-2xl leading-relaxed">
                        {post.body}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted pt-1">
                        <span>
                          {new Date(post.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {post.author_name && <span>Por: {post.author_name}</span>}
                        {/* Social links */}
                        <SocialStatusBadge
                          links={post.social_links}
                          onRetry={(platform) => handleRetrySocial(post.id, platform)}
                          isRetrying={retryingPostId === post.id}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-border w-full md:w-auto justify-end">
                    <Link to={`/posts/${post.id}`}>
                      <Button variant="secondary" size="sm">
                        ✏️ Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPostToDelete(post)}
                      className="text-danger-text hover:text-danger hover:bg-danger-soft/40"
                      title="Eliminar post"
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar esta publicación?"
        message={
          postToDelete
            ? `¿Estás seguro de que quieres eliminar '${postToDelete.title}'? Se eliminará de la web y el historial de sincronización.`
            : ''
        }
        confirmText="Sí, eliminar post"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
