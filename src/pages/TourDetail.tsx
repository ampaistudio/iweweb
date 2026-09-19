import { useState, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useSiteData } from "../context/SiteDataContext";
import { usePreferences } from "../context/PreferencesContext";
import { publicApi } from "../api/client";
import type { RawApiActivity, ActivityImage } from "../api/types";
import { resolveMediaUrl } from "../utils/media";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import TourHero from "../components/TourHero";
import type { HeroSlide } from "../components/HeroSlideshow";
import { updateSeo } from "../utils/seo";
import { TourShareWidget } from "../components/TourShareWidget";

function ArrowIcon({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${direction === "left" ? "rotate-180" : ""}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M2 8h11M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" className="tour-spec-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg aria-hidden="true" className="tour-spec-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DurationIcon() {
  return (
    <svg aria-hidden="true" className="tour-spec-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg aria-hidden="true" className="tour-spec-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg aria-hidden="true" className="tour-spec-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h4l1-14 6 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="tour-highlight-svg" viewBox="0 0 16 16" fill="none">
      <path d="M13.3 4.3l-7 7-3.6-3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TourDetail() {
  const { tourId } = useParams<{ tourId: string }>();
  const { getActivity, activities, loading: globalLoading, getContent } = useSiteData();
  const { language } = usePreferences();

  const [fullActivity, setFullActivity] = useState<RawApiActivity | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (tourId) {
      publicApi.activities
        .get(tourId, language)
        .then((data) => {
          if (isMounted && data) {
            setFullActivity(data);
          }
        })
        .catch(() => {
          // Fallback to static or global context
        });
    }
    return () => {
      isMounted = false;
    };
  }, [tourId, language]);

  if (!tourId) {
    return <Navigate to="/" replace />;
  }

  const baseActivity = getActivity(tourId);

  if (!baseActivity && !fullActivity && !globalLoading) {
    return <Navigate to="/" replace />;
  }

  if (!baseActivity && !fullActivity && globalLoading) {
    return (
      <main className="tour-detail page-width section-space">
        <div className="news-loading-state">
          <div className="news-spinner" />
          <p>Cargando experiencia...</p>
        </div>
      </main>
    );
  }

  // Merge full dynamic data with fallback
  const activity = {
    id: fullActivity?.id || baseActivity!.id,
    title: fullActivity?.title || baseActivity!.title,
    region: fullActivity?.region || baseActivity!.region,
    country: fullActivity?.country || baseActivity!.country,
    type: fullActivity?.type || baseActivity!.type,
    level: fullActivity?.level || baseActivity!.level,
    duration: fullActivity?.duration || baseActivity!.duration,
    price: fullActivity?.price ?? baseActivity?.price,
    description: fullActivity?.description || baseActivity!.description,
    introTitle: fullActivity?.intro_title || baseActivity?.intro_title,
    introText: fullActivity?.intro_text || baseActivity?.intro_text,
    highlights: (fullActivity?.highlights && fullActivity.highlights.length > 0)
      ? fullActivity.highlights
      : baseActivity?.highlights || [],
    image: fullActivity?.image_url || fullActivity?.image || baseActivity!.image,
    alt: fullActivity?.alt_text || fullActivity?.alt || baseActivity!.alt,
    itinerary: baseActivity?.itinerary,
    technicalSpecs: baseActivity?.technicalSpecs,
  };

  useEffect(() => {
    if (activity.title) {
      updateSeo({
        title: `${activity.title} | iWE Andorra`,
        description: activity.description || `${activity.type} en ${activity.region}, Andorra. Rutas y expediciones guiadas con iWE.`,
        image: activity.image,
        type: "article",
      });
    }
  }, [activity.title, activity.description, activity.image, activity.type, activity.region]);

  // Build gallery images array
  const rawImages = fullActivity?.images || baseActivity?.images;
  const galleryImages: ActivityImage[] = (rawImages && rawImages.length > 0)
    ? rawImages.map((img) => ({
        ...img,
        image_url: resolveMediaUrl(img.image_url),
        poster_url: img.poster_url ? resolveMediaUrl(img.poster_url) : undefined,
      }))
    : [
        {
          id: 0,
          activity_id: activity.id,
          image_url: resolveMediaUrl(activity.image),
          media_type: "image",
          alt_text: activity.alt,
          display_order: 0,
          is_cover: true,
        },
      ];

  // Map to HeroSlide array for TourHero
  const heroSlides: HeroSlide[] = galleryImages.map((img) => {
    if (img.media_type === "video") {
      return {
        type: "video",
        src: img.image_url,
        poster: img.poster_url,
        alt: img.alt_text || activity.title,
      };
    }
    return {
      type: "image",
      src: img.image_url,
      alt: img.alt_text || activity.title,
    };
  });

  const related = activities
    .filter((item) => item.type === activity.type && item.id !== activity.id)
    .slice(0, 3);

  const contactPhone = getContent("contact_phone", "+376 653 769");
  const whatsappUrl = buildWhatsAppUrl(
    contactPhone,
    `Hola! Quisiera reservar la experiencia "${activity.title}" (${activity.type}).`
  );

  return (
    <main className="tour-detail-page">
      {/* High-impact Hero Header */}
      <TourHero
        slides={heroSlides}
        title={activity.title}
        eyebrow={`${activity.type} · ${activity.region}`}
        variant="full"
      />

      {/* Tour Content Details */}
      <div id="tour-content" className="page-width tour-detail-body">
        {(activity.introTitle || activity.introText) && (
          <div className="tour-intro-section">
            {activity.introTitle && <h2 className="tour-intro-title">{activity.introTitle}</h2>}
            {activity.introText && (
              <div
                className="tour-intro-text"
                dangerouslySetInnerHTML={{ __html: activity.introText }}
              />
            )}
          </div>
        )}
        <div className="tour-detail-layout">
          <div className="tour-detail-copy">
            {/* Technical Specs Grid with Icons */}
            <div className="tour-specs-grid">
              <div className="tour-spec-item">
                <span className="tour-spec-icon-wrap"><LocationIcon /></span>
                <div>
                  <span className="tour-spec-label">Ubicación</span>
                  <span className="tour-spec-value">{activity.region}, {activity.country}</span>
                </div>
              </div>

              <div className="tour-spec-item">
                <span className="tour-spec-icon-wrap"><LevelIcon /></span>
                <div>
                  <span className="tour-spec-label">Nivel</span>
                  <span className="tour-spec-value">{activity.level}</span>
                </div>
              </div>

              <div className="tour-spec-item">
                <span className="tour-spec-icon-wrap"><DurationIcon /></span>
                <div>
                  <span className="tour-spec-label">Duración</span>
                  <span className="tour-spec-value">{activity.duration}</span>
                </div>
              </div>

              <div className="tour-spec-item">
                <span className="tour-spec-icon-wrap"><PriceIcon /></span>
                <div>
                  <span className="tour-spec-label">Precio</span>
                  <span className="tour-spec-value">{activity.price ? activity.price : "Consultar precio"}</span>
                </div>
              </div>

              {activity.technicalSpecs?.distanceKm && (
                <div className="tour-spec-item">
                  <span className="tour-spec-icon-wrap"><RouteIcon /></span>
                  <div>
                    <span className="tour-spec-label">Distancia</span>
                    <span className="tour-spec-value">{activity.technicalSpecs.distanceKm}</span>
                  </div>
                </div>
              )}

              {(activity.technicalSpecs?.elevationGain || activity.technicalSpecs?.elevationLoss) && (
                <div className="tour-spec-item">
                  <span className="tour-spec-icon-wrap"><RouteIcon /></span>
                  <div>
                    <span className="tour-spec-label">Desnivel</span>
                    <span className="tour-spec-value">
                      {[activity.technicalSpecs?.elevationGain, activity.technicalSpecs?.elevationLoss]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </div>
                </div>
              )}

              {activity.technicalSpecs?.minAge && (
                <div className="tour-spec-item">
                  <span className="tour-spec-icon-wrap"><LevelIcon /></span>
                  <div>
                    <span className="tour-spec-label">Edad mínima</span>
                    <span className="tour-spec-value">{activity.technicalSpecs.minAge}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div
              className="tour-description-wrap"
              dangerouslySetInnerHTML={{ __html: activity.description }}
            />

            {/* Itinerary */}
            {activity.itinerary && activity.itinerary.length > 0 && (
              <div className="tour-itinerary-section">
                <p className="tour-section-subtitle">Itinerario</p>
                <ol className="tour-itinerary-list">
                  {activity.itinerary.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Highlights 2-column cards grid */}
            {activity.highlights && activity.highlights.length > 0 && (
              <div className="tour-highlights-section">
                <p className="tour-section-subtitle">Qué incluye / Puntos destacados</p>
                <div className="tour-highlights-grid">
                  {activity.highlights.map((highlight, idx) => (
                    <div className="tour-highlight-card" key={idx}>
                      <span className="tour-highlight-check"><CheckIcon /></span>
                      <span className="tour-highlight-text">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking CTA */}
            <div className="tour-booking-cta">
              <a
                className="button button-dark tour-booking-button"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reservar esta experiencia <ArrowIcon />
              </a>
            </div>

            {/* Public Tour Share Widget */}
            <TourShareWidget
              title={activity.title}
              type={activity.type}
              region={activity.region}
            />
          </div>
        </div>

        {/* Related Tours Section */}
        {related.length > 0 && (
          <div className="tour-detail-related">
            <p className="eyebrow">También te puede interesar</p>
            <div className="tour-grid">
              {related.map((item) => (
                <Link className="tour-item" to={`/tour/${item.id}`} key={item.id}>
                  <div className="tour-image-wrap">
                    <img src={item.image} alt={item.alt} />
                    <span className="tour-arrow"><ArrowIcon /></span>
                  </div>
                  <div className="tour-details">
                    <div className="tour-meta">
                      <span>{item.region}</span>
                      <span>{item.type}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="tour-submeta">
                      <span>{item.country}</span>
                      <span>{item.level} / {item.duration}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default TourDetail;

