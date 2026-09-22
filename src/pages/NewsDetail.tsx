import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../api/client';
import type { Post } from '../api/types';
import { resolveMediaUrl } from '../utils/media';
import { formatDate, formatTextParagraphs } from '../utils/sanitize';
import { usePreferences } from '../context/PreferencesContext';
import { useSiteData } from '../context/SiteDataContext';
import { updateSeo } from '../utils/seo';

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
  const { language } = usePreferences();
  const { getContent } = useSiteData();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      const coverUrl = post.cover_image_url || (post.cover_filename ? resolveMediaUrl(post.cover_filename) : undefined);
      updateSeo({
        title: `${post.title} | iWE Andorra`,
        description: post.body,
        image: coverUrl,
        type: "article",
      });
    }
  }, [post]);

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await publicApi.posts.get(slug, language);
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
  }, [slug, language]);

  if (loading) {
    return (
      <main className="news-detail-page page-width section-space">
        <div className="news-loading-state">
          <div className="news-spinner" />
          <p>{getContent("news_detail_loading", "Cargando publicación...")}</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="news-detail-page page-width section-space">
        <Link className="text-link dark-link news-back-link" to="/novedades">
          <ArrowIcon direction="left" /> {getContent("news_detail_back_link", "Volver a novedades")}
        </Link>
        <div className="news-empty-state">
          <h2>{getContent("news_detail_not_found_title", "Publicación no encontrada")}</h2>
          <p className="news-state-message">
            {getContent(
              "news_detail_not_found_copy",
              "La noticia que buscas no existe o ha sido despublicada."
            )}
          </p>
          <Link to="/novedades" className="button button-dark">
            {getContent("news_detail_see_all", "Ver todas las novedades")} <ArrowIcon />
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
        <ArrowIcon direction="left" /> {getContent("news_detail_back_link", "Volver a novedades")}
      </Link>

      <article className="news-article">
        <header className="news-article-header">
          <p className="eyebrow">{getContent("news_detail_eyebrow", "Novedades iWE")}</p>
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
            <p className="eyebrow">{getContent("news_detail_social_title", "Ver también en redes")}</p>
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
                    {link.platform === 'instagram'
                      ? getContent("news_detail_social_instagram", "📷 Ver en Instagram")
                      : getContent("news_detail_social_facebook", "📘 Ver en Facebook")}
                    <ArrowIcon />
                  </a>
                ))}
            </div>
          </div>
        )}

        <div className="news-article-cta">
          <div>
            <p className="eyebrow">{getContent("news_detail_cta_eyebrow", "¿Te inspiró esta experiencia?")}</p>
            <h2>{getContent("news_detail_cta_title", "Planifica tu aventura con nosotros")}</h2>
          </div>
          <a href="/#contact" className="button button-dark">
            {getContent("news_detail_cta_button", "Contactar a un guía")} <ArrowIcon />
          </a>
        </div>
      </article>
    </main>
  );
}

