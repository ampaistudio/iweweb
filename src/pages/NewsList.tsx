import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import type { Post } from '../api/types';
import { resolveMediaUrl } from '../utils/media';
import { formatDate, generateExcerpt } from '../utils/sanitize';
import { usePreferences } from '../context/PreferencesContext';

function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'left' }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${direction === 'left' ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M2 8h11M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export default function NewsList() {
  const { language } = usePreferences();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);
        const data = await publicApi.posts.list({ locale: language });
        if (isMounted) {
          // Backend already filters by status=published for public requests
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError('No se pudieron cargar las publicaciones en este momento.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [language]);

  return (
    <main className="news-page page-width section-space">
      <div className="news-header">
        <Link className="text-link dark-link news-back-link" to="/">
          <ArrowIcon direction="left" /> Volver al inicio
        </Link>
        <p className="eyebrow">Actualidad &amp; Rutas</p>
        <h1>Novedades de la montaña</h1>
        <p className="large-copy">
          Descubre las últimas noticias, estados de senderos, consejos técnicos y relatos de nuestras expediciones en Andorra y los Pirineos.
        </p>
      </div>

      {loading && (
        <div className="news-loading-state">
          <div className="news-spinner" />
          <p>Cargando novedades...</p>
        </div>
      )}

      {error && !loading && (
        <div className="news-empty-state">
          <p className="news-state-message">{error}</p>
          <a href="/#contact" className="button button-dark">
            Contactar con nosotros <ArrowIcon />
          </a>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="news-empty-state">
          <h3>Próximamente nuevas publicaciones</h3>
          <p className="news-state-message">
            Estamos preparando nuevas historias y reportes de temporada. ¡Vuelve a visitarnos pronto!
          </p>
          <Link to="/" className="button button-dark">
            Explorar actividades <ArrowIcon />
          </Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="news-grid">
          {posts.map((post) => {
            const imageUrl = resolveMediaUrl(post.cover_image_url || post.cover_filename);
            const dateStr = formatDate(post.published_at || post.created_at);
            const excerpt = generateExcerpt(post.body, 140);

            return (
              <article className="news-card" key={post.id}>
                <Link to={`/novedades/${post.slug || post.id}`} className="news-card-image-wrap">
                  {imageUrl ? (
                    <img src={imageUrl} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="news-card-placeholder">
                      <span className="brand-symbol">i<span>WE</span></span>
                    </div>
                  )}
                  <span className="tour-arrow"><ArrowIcon /></span>
                </Link>

                <div className="news-card-body">
                  <div className="news-card-meta">
                    {dateStr && <span>{dateStr}</span>}
                    {post.author_name && <span>{post.author_name}</span>}
                  </div>

                  <h3>
                    <Link to={`/novedades/${post.slug || post.id}`}>
                      {post.title}
                    </Link>
                  </h3>

                  <p className="news-card-excerpt">{excerpt}</p>

                  <Link to={`/novedades/${post.slug || post.id}`} className="text-link dark-link news-read-more">
                    Leer más <ArrowIcon />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

