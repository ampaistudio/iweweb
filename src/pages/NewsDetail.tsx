import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../api/client';
import type { Post } from '../api/types';
import { resolveMediaUrl } from '../utils/media';
import { formatDate, formatTextParagraphs } from '../utils/sanitize';

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

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await publicApi.posts.get(slug);
        if (isMounted) {
          setPost(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError('Publicación no encontrada o no disponible.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="news-detail-page page-width section-space">
        <div className="news-loading-state">
          <div className="news-spinner" />
          <p>Cargando publicación...</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="news-detail-page page-width section-space">
        <Link className="text-link dark-link news-back-link" to="/novedades">
          <ArrowIcon direction="left" /> Volver a novedades
        </Link>
        <div className="news-empty-state">
          <h2>Publicación no encontrada</h2>
          <p className="news-state-message">
            La noticia que buscas no existe o ha sido despublicada.
          </p>
          <Link to="/novedades" className="button button-dark">
            Ver todas las novedades <ArrowIcon />
          </Link>
        </div>
      </main>
    );
  }

  const imageUrl = resolveMediaUrl(post.cover_image_url || post.cover_filename);
  const dateStr = formatDate(post.published_at || post.created_at);
  const paragraphs = formatTextParagraphs(post.body);

  return (
    <main className="news-detail-page page-width section-space">
      <Link className="text-link dark-link news-back-link" to="/novedades">
        <ArrowIcon direction="left" /> Volver a novedades
      </Link>

      <article className="news-article">
        <header className="news-article-header">
          <p className="eyebrow">Novedades iWE</p>
          <h1>{post.title}</h1>
          <div className="news-article-meta">
            {dateStr && <span className="news-meta-date">{dateStr}</span>}
            {post.author_name && (
              <span className="news-meta-author">Por {post.author_name}</span>
            )}
          </div>
        </header>

        {imageUrl && (
          <div className="news-article-cover">
            <img src={imageUrl} alt={post.title} />
          </div>
        )}

        <div className="news-article-content">
          {paragraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {post.social_links && post.social_links.length > 0 && (
          <div className="news-social-links">
            <p className="eyebrow">Ver también en redes</p>
            <div className="news-social-badges">
              {post.social_links
                .filter((link) => link.external_permalink)
                .map((link) => (
                  <a
                    key={`${link.platform}-${link.external_post_id}`}
                    href={link.external_permalink!}
                    target="_blank"
                    rel="noreferrer"
                    className="news-social-pill"
                  >
                    {link.platform === 'instagram' ? '📷 Ver en Instagram' : '📘 Ver en Facebook'}
                    <ArrowIcon />
                  </a>
                ))}
            </div>
          </div>
        )}

        <div className="news-article-cta">
          <div>
            <p className="eyebrow">¿Te inspiró esta experiencia?</p>
            <h2>Planifica tu aventura con nosotros</h2>
          </div>
          <a href="/#contact" className="button button-dark">
            Contactar a un guía <ArrowIcon />
          </a>
        </div>
      </article>
    </main>
  );
}

