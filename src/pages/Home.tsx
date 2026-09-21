import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { packages, type Activity, type ActivityType } from "../data/activities";
import HeroSlideshow from "../components/HeroSlideshow";
import { useSiteData } from "../context/SiteDataContext";
import { publicApi } from "../api/client";
import type { UnifiedReview } from "../api/types";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { updateSeo } from "../utils/seo";

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

function ActivityGrid({ type, activities }: { type: ActivityType; activities: Activity[] }) {
  const filtered = activities.filter((activity) => activity.type === type);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="tour-grid">
      {filtered.map((activity) => (
        <Link className="tour-item" id={activity.id} to={`/tour/${activity.id}`} key={activity.id}>
          <div className="tour-image-wrap">
            <img src={activity.image} alt={activity.alt} />
            <span className="tour-arrow"><ArrowIcon /></span>
          </div>
          <div className="tour-details">
            <div className="tour-meta"><span>{activity.region}</span><span>{activity.type}</span></div>
            <h3>{activity.title}</h3>
            <div className="tour-submeta"><span>{activity.country}</span><span>{activity.level} / {activity.duration}</span></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

const DEFAULT_DIRECT_REVIEWS_JSON = JSON.stringify([
  {
    quote: "Charlie fue un guía excepcional en nuestra ruta 4x4 hasta Tor: gran conocedor de la zona, muy buen conductor y siempre atento a que disfrutáramos cada parada para sacar fotos.",
    name: "Joan",
    location: "Andorra la Vella",
    tour: "4x4 a Tor",
    rating: 5,
  },
  {
    quote: "Salimos en e-bike por las montañas de Andorra con Carlos como guía. Se adaptó a nuestro nivel técnico y físico desde el primer momento y nos llevó por rutas que jamás hubiéramos encontrado solos.",
    name: "Cliente verificado",
    location: "Begur, España",
    tour: "E-Bike Enduro",
    rating: 5,
  },
  {
    quote: "Reservamos una excursión 4x4 con nuestro perro y aprendimos sobre la naturaleza y la historia de la zona durante todo el recorrido. Una experiencia que recomendamos sin dudar.",
    name: "Melanie",
    location: "Países Bajos",
    tour: "4x4 Lagos Off-Road",
    rating: 5,
  },
]);

function Home() {
  const [platformReviews, setPlatformReviews] = useState<UnifiedReview[]>([]);
  const [isGoogleMock, setIsGoogleMock] = useState(true);
  const [isTripadvisorMock, setIsTripadvisorMock] = useState(true);
  const [selectedSource, setSelectedSource] = useState<"all" | "google" | "tripadvisor" | "direct">("all");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const { activities, heroSlides, getContent } = useSiteData();

  const reviewsGooglePublished = getContent("reviews_google_published", "true") !== "false" && getContent("reviews_google_published", "true") !== "0";
  const reviewsTripadvisorPublished = getContent("reviews_tripadvisor_published", "true") !== "false" && getContent("reviews_tripadvisor_published", "true") !== "0";
  const reviewsDirectPublished = getContent("reviews_direct_published", "true") !== "false" && getContent("reviews_direct_published", "true") !== "0";

  const directReviewsItemsRaw = getContent("reviews_direct_items", DEFAULT_DIRECT_REVIEWS_JSON);
  const directReviews: UnifiedReview[] = useMemo(() => {
    try {
      const parsed = JSON.parse(directReviewsItemsRaw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((r, i) => ({
        id: `direct-${i}`,
        quote: r.quote || "",
        name: r.name || "Cliente iWE",
        location: r.location || "",
        tour: r.tour || "",
        rating: typeof r.rating === "number" ? r.rating : 5,
        source: "direct" as const,
      }));
    } catch {
      return [];
    }
  }, [directReviewsItemsRaw]);

  const allReviews = useMemo(() => [...directReviews, ...platformReviews], [directReviews, platformReviews]);

  const isGoogleVisible = reviewsGooglePublished && !isGoogleMock;
  const isTripadvisorVisible = reviewsTripadvisorPublished && !isTripadvisorMock;
  const isDirectVisible = reviewsDirectPublished;

  useEffect(() => {
    const title = getContent("seo_meta_title", "iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra");
    const description = getContent("seo_meta_description", getContent("mission_text") || "Descubre experiencias únicas en Andorra y los Pirineos con guías expertos.");
    const image = getContent("seo_og_image", "");
    updateSeo({
      title,
      description,
      image: image || undefined,
    });
  }, [getContent]);

  useEffect(() => {
    let isMounted = true;

    async function loadPlatformReviews() {
      try {
        const [googleRes, tripadvisorRes] = await Promise.allSettled([
          publicApi.reviews.google(),
          publicApi.reviews.tripadvisor(),
        ]);

        const fetched: UnifiedReview[] = [];

        if (googleRes.status === "fulfilled" && googleRes.value) {
          if (isMounted) setIsGoogleMock(!!googleRes.value.is_mock);
          if (googleRes.value.reviews) {
            googleRes.value.reviews.forEach((gr, idx) => {
              fetched.push({
                id: `google-${idx}`,
                quote: gr.text,
                name: gr.author_name,
                location: "Google Maps",
                tour: "Experiencia verificada",
                rating: gr.rating,
                date: gr.relative_time_description,
                source: "google",
                avatarUrl: gr.profile_photo_url,
                isMock: googleRes.value.is_mock,
              });
            });
          }
        }

        if (tripadvisorRes.status === "fulfilled" && tripadvisorRes.value) {
          if (isMounted) setIsTripadvisorMock(!!tripadvisorRes.value.is_mock);
          if (tripadvisorRes.value.reviews) {
            tripadvisorRes.value.reviews.forEach((tr, idx) => {
              fetched.push({
                id: `ta-${tr.id || idx}`,
                quote: tr.text,
                name: tr.user?.username || "Viajero TripAdvisor",
                location: tr.user?.user_location?.name || "TripAdvisor",
                tour: tr.title,
                rating: tr.rating,
                date: tr.published_date,
                source: "tripadvisor",
                isMock: tripadvisorRes.value.is_mock,
              });
            });
          }
        }

        if (isMounted && fetched.length > 0) {
          setPlatformReviews(fetched);
        }
      } catch {
        // Resilient fallback
      }
    }

    loadPlatformReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAllReviews = useMemo(() => allReviews.filter((r) => {
    if (r.source === "google" && !isGoogleVisible) return false;
    if (r.source === "tripadvisor" && !isTripadvisorVisible) return false;
    if (r.source === "direct" && !isDirectVisible) return false;
    return true;
  }), [allReviews, isGoogleVisible, isTripadvisorVisible, isDirectVisible]);

  useEffect(() => {
    if (
      (selectedSource === "google" && !isGoogleVisible) ||
      (selectedSource === "tripadvisor" && !isTripadvisorVisible) ||
      (selectedSource === "direct" && !isDirectVisible)
    ) {
      setSelectedSource("all");
      setReviewIndex(0);
    }
  }, [selectedSource, isGoogleVisible, isTripadvisorVisible, isDirectVisible]);

  const filteredReviews = useMemo(() => {
    if (selectedSource === "all") return visibleAllReviews;
    if (
      (selectedSource === "google" && !isGoogleVisible) ||
      (selectedSource === "tripadvisor" && !isTripadvisorVisible) ||
      (selectedSource === "direct" && !isDirectVisible)
    ) return [];
    return visibleAllReviews.filter((r) => r.source === selectedSource);
  }, [visibleAllReviews, selectedSource, isGoogleVisible, isTripadvisorVisible, isDirectVisible]);

  const handleNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || submittingNewsletter) return;

    setSubmittingNewsletter(true);
    setNewsletterError(null);

    try {
      await publicApi.newsletter.subscribe(cleanEmail);
      setSubscribed(true);
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar la suscripción. Inténtalo de nuevo.";
      setNewsletterError(msg);
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const currentReview = filteredReviews[reviewIndex % (filteredReviews.length || 1)] || directReviews[0] || {
    id: "empty",
    quote: "",
    name: "",
    rating: 5,
    source: "direct",
  };

  const moveReview = (direction: number) => {
    if (filteredReviews.length <= 1) return;
    setReviewIndex((current) => (current + direction + filteredReviews.length) % filteredReviews.length);
  };

  const heroEyebrow = getContent("hero_eyebrow", "Elige tu experiencia con nosotros");
  const heroTitleLine1 = getContent("hero_title_line1", "Todas las experiencias.");
  const heroTitleLine2 = getContent("hero_title_line2", "Un solo operador.");
  const heroCopy = getContent("hero_copy", "iWE, la agencia líder en turismo de experiencias. Esquí, snowboard, raquetas de nieve, BTT, 4x4, vía ferrata, senderismo y mucho más en Andorra y los Pirineos, todo el año.");
  const heroTagline = getContent("hero_tagline", "Fabricamos experiencias.");
  const missionEyebrow = getContent("mission_eyebrow", "Nuestra empresa");
  const missionTitle = getContent("mission_title", "Líderes en turismo de experiencias en Andorra y los Pirineos.");
  const missionText = getContent(
    "mission_text",
    "Descubre un mundo de experiencias únicas con un solo operador turístico. Esquí, snowboard, raquetas de nieve, tours culturales y todo lo que te puedas imaginar para vivir la montaña, guiado por expertos locales como Charly Paredes."
  );
  const missionImage = getContent("mission_image", "https://i-wildland.com/wp-content/uploads/2020/04/roc-del-quer-2.jpg");
  const teamEyebrow = getContent("team_eyebrow", "Nuestro equipo");
  const teamTitle = getContent("team_title", "Fundada en 2018. Guiada por expertos locales.");
  const teamBio = getContent(
    "team_bio",
    "iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2 (EFPEM Andorra), instructor de esquí certificado por AADIDES/ISIA y miembro de UIMLA y AGAMA. Formado entre Ushuaia y Andorra, habla catalán, español, francés e inglés.\n\nCada ruta está pensada para adaptarse a tu nivel físico y técnico, sea que viajes en familia, en pareja o con amigos. Tú pones la curiosidad. Nosotros nos ocupamos del resto."
  );
  const teamImage = getContent("team_image", "https://i-wildland.com/wp-content/uploads/2022/07/FSF-49-1024x683-iWE.jpg");
  const teamImageNoteLine1 = getContent("team_image_note_line1", "Conocimiento local.");
  const teamImageNoteLine2 = getContent("team_image_note_line2", "Experiencia real.");
  const toursPublished = getContent("tours_section_published", "true") !== "false" && getContent("tours_section_published", "true") !== "0";
  const toursEyebrow = getContent("tours_eyebrow", "Tours en Andorra");
  const toursTitleLine1 = getContent("tours_title_line1", "Vacaciones");
  const toursTitleLine2 = getContent("tours_title_line2", "completas con iWE.");
  const toursCopy = getContent("tours_copy", "Combina alojamiento, guías y actividades en un solo paquete. Ideal para grupos, familias y viajes de aventura sin preocuparte por la logística.");
  const toursCtaText = getContent("tours_cta_text", "Consultar disponibilidad");

  const heroCtaActivities = getContent("hero_cta_activities", "Ver actividades");
  const heroCtaReserve = getContent("hero_cta_reserve", "Reservar ahora");
  const heroScrollHint = getContent("hero_scroll_hint", "Descubre más");
  const missionTeamLink = getContent("mission_team_link", "Nuestro equipo");
  const missionStat1Value = getContent("mission_stat1_value", "2018");
  const missionStat1Label = getContent("mission_stat1_label", "año de fundación");
  const missionStat2Value = getContent("mission_stat2_value", "15+");
  const missionStat2Label = getContent("mission_stat2_label", "tipos de actividades");
  const missionStat3Value = getContent("mission_stat3_value", "2");
  const missionStat3Label = getContent("mission_stat3_label", "regiones: Andorra y Pirineos");
  const teamContactLink = getContent("team_contact_link", "Cómo trabajamos");

  const activitiesBikeEyebrow = getContent("activities_bike_eyebrow", "Enduro, E-Bike, BTT y remontes");
  const activitiesBikeTitle = getContent("activities_bike_title", "Bike");
  const activitiesViaFerrataEyebrow = getContent("activities_via_ferrata_eyebrow", "Iniciación y avanzado");
  const activitiesViaFerrataTitle = getContent("activities_via_ferrata_title", "Vía Ferrata");
  const activities4x4Eyebrow = getContent("activities_4x4_eyebrow", "Lagos Off-Road, Tor y Pic Negre");
  const activities4x4Title = getContent("activities_4x4_title", "4×4");
  const activitiesSenderismoEyebrow = getContent("activities_senderismo_eyebrow", "Medio día y día completo");
  const activitiesSenderismoTitle = getContent("activities_senderismo_title", "Senderismo");
  const activitiesEsquiEyebrow = getContent("activities_esqui_eyebrow", "Raquetas y esquí tour");
  const activitiesEsquiTitle = getContent("activities_esqui_title", "Esquí-Snow");

  const calendarHolidayLabel = getContent("calendar_holiday_label", "Holiday");
  const calendarEventsLabel = getContent("calendar_events_label", "Eventos");
  const calendarEventsName = getContent("calendar_events_name", "Team Building & Eventos Deportivos");
  const calendarEventsPlace = getContent("calendar_events_place", "Andorra");

  const weatherEyebrow = getContent("weather_eyebrow", "Condiciones en tiempo real");
  const weatherTitleLine1 = getContent("weather_title_line1", "El tiempo en Andorra");
  const weatherTitleLine2 = getContent("weather_title_line2", "y los Pirineos.");
  const weatherCopy = getContent("weather_copy", "Previsión meteorológica y mapa interactivo de viento en directo para planificar tus salidas de BTT, senderismo o esquí con la máxima seguridad.");
  const weatherMapLat = getContent("weather_map_lat", "42.5459743");
  const weatherMapLon = getContent("weather_map_lon", "1.5140217");
  const weatherMetaLocation = getContent("weather_meta_location", "Andorra (42.55° N, 1.51° E) • Modelo ECMWF");
  const weatherMetaBadge = getContent("weather_meta_badge", "Viento & Previsión en vivo");

  const reviewsEyebrow = getContent("reviews_eyebrow", "Opiniones de clientes");
  const reviewsTabAll = getContent("reviews_tab_all", "Todas");
  const reviewsTabGoogle = getContent("reviews_tab_google", "Google ★ 4.9");
  const reviewsTabTripadvisor = getContent("reviews_tab_tripadvisor", "TripAdvisor ★ 5.0");
  const reviewsTabDirect = getContent("reviews_tab_direct", "iWE");

  const newsletterSuccessMessage = getContent("newsletter_success_message", "Ya formas parte de la lista. Nos vemos en la montaña.");
  const newsletterEmailLabel = getContent("newsletter_email_label", "Tu correo electrónico");
  const contactWhatsappLink = getContent("contact_whatsapp_link", "O escríbenos directamente");

  return (
    <main id="top">
      <section className="hero-section">
        <HeroSlideshow slides={heroSlides} />
        <div className="hero-overlay" />
        <div className="hero-content page-width">
          <p className="eyebrow light-eyebrow">{heroEyebrow}</p>
          <h1>{heroTitleLine1}<br /><em>{heroTitleLine2}</em></h1>
          <p className="hero-copy">{heroCopy}</p>
          <div className="hero-actions">
            <a className="button button-light" href="#bike">{heroCtaActivities} <ArrowIcon /></a>
            <a className="text-link light-link" href="#contact">{heroCtaReserve} <ArrowIcon /></a>
          </div>
        </div>
        <a className="hero-scroll" href="#mission"><span />{heroScrollHint}</a>
      </section>

      <section id="mission" className="mission-section page-width section-space">
        <div className="mission-image-wrap reveal-up">
          <img
            src={missionImage}
            alt="Roc del Quer, Andorra"
          />
          <span className="image-caption">{heroTagline}</span>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">{missionEyebrow}</p>
          <h2>{missionTitle}</h2>
          <p className="large-copy">{missionText}</p>
          <a className="text-link dark-link" href="#team">{missionTeamLink} <ArrowIcon /></a>
          <div className="mission-numbers" aria-label="iWE de un vistazo">
            <div><strong>{missionStat1Value}</strong><span>{missionStat1Label}</span></div>
            <div><strong>{missionStat2Value}</strong><span>{missionStat2Label}</span></div>
            <div><strong>{missionStat3Value}</strong><span>{missionStat3Label}</span></div>
          </div>
        </div>
      </section>

      <section id="team" className="why-section">
        <div className="why-image-panel">
          <img
            src={teamImage}
            alt="Equipo de iWE guiando una experiencia de montaña"
          />
          <div className="why-image-note"><span>01</span><span>{teamImageNoteLine1}<br />{teamImageNoteLine2}</span></div>
        </div>
        <div className="why-copy-panel">
          <p className="eyebrow">{teamEyebrow}</p>
          <h2>{teamTitle}</h2>
          {teamBio.split(/\n\s*\n/).map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
          <a className="button button-dark" href="#contact">{teamContactLink} <ArrowIcon /></a>
        </div>
      </section>

      <section id="bike" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesBikeEyebrow}</p>
              <h2>{activitiesBikeTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="BTT" activities={activities} />
        </div>
      </section>

      <section id="via-ferrata" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesViaFerrataEyebrow}</p>
              <h2>{activitiesViaFerrataTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Vía Ferrata" activities={activities} />
        </div>
      </section>

      <section id="4x4" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activities4x4Eyebrow}</p>
              <h2>{activities4x4Title}</h2>
            </div>
          </div>
          <ActivityGrid type="4x4" activities={activities} />
        </div>
      </section>

      <section id="senderismo" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesSenderismoEyebrow}</p>
              <h2>{activitiesSenderismoTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Senderismo" activities={activities} />
        </div>
      </section>

      <section id="esqui-snow" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesEsquiEyebrow}</p>
              <h2>{activitiesEsquiTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Esquí-Snow" activities={activities} />
        </div>
      </section>

      {toursPublished && (
        <section id="tours" className="calendar-section section-space page-width">
          <div className="calendar-intro">
            <p className="eyebrow">{toursEyebrow}</p>
            <h2>{toursTitleLine1}<br /><em>{toursTitleLine2}</em></h2>
            <p>{toursCopy}</p>
            <a className="button button-dark" href="#contact">{toursCtaText} <ArrowIcon /></a>
          </div>
          <div className="calendar-list">
            {packages.map((pkg) => (
              <div className="calendar-row" key={`${pkg.name}-${pkg.duration}`}>
                <span className="calendar-month">{calendarHolidayLabel}</span>
                <span className="calendar-tour">{pkg.name}</span>
                <span className="calendar-place">{pkg.duration}</span>
                <ArrowIcon />
              </div>
            ))}
            <div className="calendar-row"><span className="calendar-month">{calendarEventsLabel}</span><span className="calendar-tour">{calendarEventsName}</span><span className="calendar-place">{calendarEventsPlace}</span><ArrowIcon /></div>
          </div>
        </section>
      )}

      <section id="weather" className="weather-section section-space">
        <div className="page-width">
          <div className="weather-header">
            <p className="eyebrow">{weatherEyebrow}</p>
            <h2>{weatherTitleLine1}<br /><em>{weatherTitleLine2}</em></h2>
            <p>
              {weatherCopy}
            </p>
          </div>
          <div className="weather-map-wrap">
            <iframe
              className="weather-map-frame"
              title="Mapa meteorológico y viento en Andorra - Windy"
              src={`https://embed.windy.com/embed2.html?lat=${encodeURIComponent(weatherMapLat)}&lon=${encodeURIComponent(weatherMapLon)}&detailLat=${encodeURIComponent(weatherMapLat)}&detailLon=${encodeURIComponent(weatherMapLon)}&width=650&height=450&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
              loading="lazy"
            />
            <div className="weather-meta-bar">
              <span>{weatherMetaLocation}</span>
              <span className="weather-meta-badge">{weatherMetaBadge}</span>
            </div>
          </div>
        </div>
      </section>

      {(isGoogleVisible || isTripadvisorVisible || isDirectVisible) && visibleAllReviews.length > 0 && (
        <section id="stories" className="reviews-section section-space">
          <div className="page-width reviews-layout">
            <div className="reviews-label">
              <p className="eyebrow">{reviewsEyebrow}</p>
              <span className="review-count">
                {String(reviewIndex + 1).padStart(2, "0")}
                <small>/{String(filteredReviews.length || 1).padStart(2, "0")}</small>
              </span>
              <div className="review-source-tabs" role="tablist" aria-label="Filtrar por origen de reseña">
                <button
                  type="button"
                  className={`review-source-tab ${selectedSource === "all" ? "active" : ""}`}
                  onClick={() => { setSelectedSource("all"); setReviewIndex(0); }}
                >
                  {reviewsTabAll} ({visibleAllReviews.length})
                </button>
                {isGoogleVisible && (
                  <button
                    type="button"
                    className={`review-source-tab ${selectedSource === "google" ? "active" : ""}`}
                    onClick={() => { setSelectedSource("google"); setReviewIndex(0); }}
                  >
                    {reviewsTabGoogle}
                  </button>
                )}
                {isTripadvisorVisible && (
                  <button
                    type="button"
                    className={`review-source-tab ${selectedSource === "tripadvisor" ? "active" : ""}`}
                    onClick={() => { setSelectedSource("tripadvisor"); setReviewIndex(0); }}
                  >
                    {reviewsTabTripadvisor}
                  </button>
                )}
                {isDirectVisible && (
                  <button
                    type="button"
                    className={`review-source-tab ${selectedSource === "direct" ? "active" : ""}`}
                    onClick={() => { setSelectedSource("direct"); setReviewIndex(0); }}
                  >
                    {reviewsTabDirect}
                  </button>
                )}
              </div>
            </div>
            <div className="review-content">
              <div className="review-stars" aria-label="Calificación 5 estrellas">
                {"★".repeat(currentReview.rating || 5)}
              </div>
              <blockquote>{currentReview.quote}</blockquote>
              <div className="review-byline">
                <strong>{currentReview.name}</strong>
                <span>
                  {currentReview.location ? `${currentReview.location} • ` : ""}
                  {currentReview.tour || "Experiencia iWE"}
                  {currentReview.date ? ` (${currentReview.date})` : ""}
                </span>
                <span className="review-source-badge">
                  {currentReview.source === "google" && "📍 Google Reviews"}
                  {currentReview.source === "tripadvisor" && "🦉 TripAdvisor"}
                  {currentReview.source === "direct" && "🏔️ iWE Experiencias"}
                </span>
              </div>
              <div className="review-controls">
                <button type="button" aria-label="Previous review" onClick={() => moveReview(-1)}>
                  <ArrowIcon direction="left" />
                </button>
                <button type="button" aria-label="Next review" onClick={() => moveReview(1)}>
                  <ArrowIcon />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="contact-section section-space page-width">
        <div>
          <p className="eyebrow">{getContent("contact_eyebrow", "Mantente inspirado")}</p>
          <h2>{getContent("contact_title_line1", "Más montaña.")}<br /><em>{getContent("contact_title_line2", "Menos rutina.")}</em></h2>
        </div>
        <div className="contact-copy">
          <p>{getContent("contact_copy", "Recibe novedades, disponibilidad de actividades y un poco de inspiración para tu próxima aventura. Sin ruido. Solo lo bueno.")}</p>
          {subscribed ? (
            <p className="success-message">{newsletterSuccessMessage}</p>
          ) : (
            <>
              <form className="newsletter-form" onSubmit={handleNewsletter}>
                <label className="sr-only" htmlFor="email">{newsletterEmailLabel}</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={newsletterEmailLabel}
                  value={email}
                  disabled={submittingNewsletter}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button type="submit" aria-label="Subscribe" disabled={submittingNewsletter}>
                  <ArrowIcon />
                </button>
              </form>
              {newsletterError && <p className="newsletter-error-message">{newsletterError}</p>}
            </>
          )}
          <a
            className="text-link dark-link"
            href={buildWhatsAppUrl(getContent("contact_phone", "+376 653 769"), "Hola! Quisiera más información sobre las experiencias de iWE.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            {contactWhatsappLink} <ArrowIcon />
          </a>
        </div>
      </section>
    </main>
  );
}

export default Home;
