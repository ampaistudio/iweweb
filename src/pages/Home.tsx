import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { packages, reviews as defaultReviews, type Activity, type ActivityType } from "../data/activities";
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

const initialReviews: UnifiedReview[] = defaultReviews.map((r, i) => ({
  id: `direct-${i}`,
  quote: r.quote,
  name: r.name,
  location: r.location,
  tour: r.tour,
  rating: 5,
  source: "direct" as const,
}));

function Home() {
  const [allReviews, setAllReviews] = useState<UnifiedReview[]>(initialReviews);
  const [selectedSource, setSelectedSource] = useState<"all" | "google" | "tripadvisor" | "direct">("all");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { activities, heroSlides, getContent } = useSiteData();

  useEffect(() => {
    updateSeo({
      title: "iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra",
      description: getContent("mission_text") || "Descubre experiencias únicas en Andorra y los Pirineos con guías expertos.",
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

        if (googleRes.status === "fulfilled" && googleRes.value?.reviews) {
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

        if (tripadvisorRes.status === "fulfilled" && tripadvisorRes.value?.reviews) {
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

        if (isMounted && fetched.length > 0) {
          setAllReviews([...initialReviews, ...fetched]);
        }
      } catch {
        // Resilient fallback: keep initial curated reviews
      }
    }

    loadPlatformReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    if (selectedSource === "all") return allReviews;
    return allReviews.filter((r) => r.source === selectedSource);
  }, [allReviews, selectedSource]);

  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  const currentReview = filteredReviews[reviewIndex % (filteredReviews.length || 1)] || initialReviews[0];

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
  const teamEyebrow = getContent("team_eyebrow", "Nuestro equipo");
  const teamTitle = getContent("team_title", "Fundada en 2018. Guiada por expertos locales.");
  const teamBio = getContent(
    "team_bio",
    "iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2 (EFPEM Andorra), instructor de esquí certificado por AADIDES/ISIA y miembro de UIMLA y AGAMA. Formado entre Ushuaia y Andorra, habla catalán, español, francés e inglés.\n\nCada ruta está pensada para adaptarse a tu nivel físico y técnico, sea que viajes en familia, en pareja o con amigos. Tú pones la curiosidad. Nosotros nos ocupamos del resto."
  );
  const toursPublished = getContent("tours_section_published", "true") !== "false" && getContent("tours_section_published", "true") !== "0";
  const toursEyebrow = getContent("tours_eyebrow", "Tours en Andorra");
  const toursTitleLine1 = getContent("tours_title_line1", "Vacaciones");
  const toursTitleLine2 = getContent("tours_title_line2", "completas con iWE.");
  const toursCopy = getContent("tours_copy", "Combina alojamiento, guías y actividades en un solo paquete. Ideal para grupos, familias y viajes de aventura sin preocuparte por la logística.");
  const toursCtaText = getContent("tours_cta_text", "Consultar disponibilidad");

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
            <a className="button button-light" href="#bike">Ver actividades <ArrowIcon /></a>
            <a className="text-link light-link" href="#contact">Reservar ahora <ArrowIcon /></a>
          </div>
        </div>
        <a className="hero-scroll" href="#mission"><span />Descubre más</a>
      </section>

      <section id="mission" className="mission-section page-width section-space">
        <div className="mission-image-wrap reveal-up">
          <img
            src="https://i-wildland.com/wp-content/uploads/2020/04/roc-del-quer-2.jpg"
            alt="Roc del Quer, Andorra"
          />
          <span className="image-caption">{heroTagline}</span>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">{missionEyebrow}</p>
          <h2>{missionTitle}</h2>
          <p className="large-copy">{missionText}</p>
          <a className="text-link dark-link" href="#team">Nuestro equipo <ArrowIcon /></a>
          <div className="mission-numbers" aria-label="iWE de un vistazo">
            <div><strong>2018</strong><span>año de fundación</span></div>
            <div><strong>15+</strong><span>tipos de actividades</span></div>
            <div><strong>2</strong><span>regiones: Andorra y Pirineos</span></div>
          </div>
        </div>
      </section>

      <section id="team" className="why-section">
        <div className="why-image-panel">
          <img
            src="https://i-wildland.com/wp-content/uploads/2022/07/FSF-49-1024x683-iWE.jpg"
            alt="Equipo de iWE guiando una experiencia de montaña"
          />
          <div className="why-image-note"><span>01</span><span>Conocimiento local.<br />Experiencia real.</span></div>
        </div>
        <div className="why-copy-panel">
          <p className="eyebrow">{teamEyebrow}</p>
          <h2>{teamTitle}</h2>
          {teamBio.split(/\n\s*\n/).map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
          <a className="button button-dark" href="#contact">Cómo trabajamos <ArrowIcon /></a>
        </div>
      </section>

      <section id="bike" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Enduro, E-Bike, BTT y remontes</p>
              <h2>Bike</h2>
            </div>
          </div>
          <ActivityGrid type="BTT" activities={activities} />
        </div>
      </section>

      <section id="via-ferrata" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Iniciación y avanzado</p>
              <h2>Vía Ferrata</h2>
            </div>
          </div>
          <ActivityGrid type="Vía Ferrata" activities={activities} />
        </div>
      </section>

      <section id="4x4" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Lagos Off-Road, Tor y Pic Negre</p>
              <h2>4×4</h2>
            </div>
          </div>
          <ActivityGrid type="4x4" activities={activities} />
        </div>
      </section>

      <section id="senderismo" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Medio día y día completo</p>
              <h2>Senderismo</h2>
            </div>
          </div>
          <ActivityGrid type="Senderismo" activities={activities} />
        </div>
      </section>

      <section id="esqui-snow" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Raquetas y esquí tour</p>
              <h2>Esquí-Snow</h2>
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
                <span className="calendar-month">Holiday</span>
                <span className="calendar-tour">{pkg.name}</span>
                <span className="calendar-place">{pkg.duration}</span>
                <ArrowIcon />
              </div>
            ))}
            <div className="calendar-row"><span className="calendar-month">Eventos</span><span className="calendar-tour">Team Building &amp; Eventos Deportivos</span><span className="calendar-place">Andorra</span><ArrowIcon /></div>
          </div>
        </section>
      )}

      <section id="weather" className="weather-section section-space">
        <div className="page-width">
          <div className="weather-header">
            <p className="eyebrow">Condiciones en tiempo real</p>
            <h2>El tiempo en Andorra<br /><em>y los Pirineos.</em></h2>
            <p>
              Previsión meteorológica y mapa interactivo de viento en directo para planificar tus salidas de BTT, senderismo o esquí con la máxima seguridad.
            </p>
          </div>
          <div className="weather-map-wrap">
            <iframe
              className="weather-map-frame"
              title="Mapa meteorológico y viento en Andorra - Windy"
              src="https://embed.windy.com/embed2.html?lat=42.5459743&lon=1.5140217&detailLat=42.5459743&detailLon=1.5140217&width=650&height=450&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"
              loading="lazy"
            />
            <div className="weather-meta-bar">
              <span>Andorra (42.55° N, 1.51° E) • Modelo ECMWF</span>
              <span className="weather-meta-badge">Viento &amp; Previsión en vivo</span>
            </div>
          </div>
        </div>
      </section>

      <section id="stories" className="reviews-section section-space">
        <div className="page-width reviews-layout">
          <div className="reviews-label">
            <p className="eyebrow">Opiniones de clientes</p>
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
                Todas ({allReviews.length})
              </button>
              <button
                type="button"
                className={`review-source-tab ${selectedSource === "google" ? "active" : ""}`}
                onClick={() => { setSelectedSource("google"); setReviewIndex(0); }}
              >
                Google ★ 4.9
              </button>
              <button
                type="button"
                className={`review-source-tab ${selectedSource === "tripadvisor" ? "active" : ""}`}
                onClick={() => { setSelectedSource("tripadvisor"); setReviewIndex(0); }}
              >
                TripAdvisor ★ 5.0
              </button>
              <button
                type="button"
                className={`review-source-tab ${selectedSource === "direct" ? "active" : ""}`}
                onClick={() => { setSelectedSource("direct"); setReviewIndex(0); }}
              >
                iWE
              </button>
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

      <section id="contact" className="contact-section section-space page-width">
        <div>
          <p className="eyebrow">{getContent("contact_eyebrow", "Mantente inspirado")}</p>
          <h2>{getContent("contact_title_line1", "Más montaña.")}<br /><em>{getContent("contact_title_line2", "Menos rutina.")}</em></h2>
        </div>
        <div className="contact-copy">
          <p>{getContent("contact_copy", "Recibe novedades, disponibilidad de actividades y un poco de inspiración para tu próxima aventura. Sin ruido. Solo lo bueno.")}</p>
          {subscribed ? (
            <p className="success-message">Ya formas parte de la lista. Nos vemos en la montaña.</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <label className="sr-only" htmlFor="email">Tu correo electrónico</label>
              <input id="email" type="email" required placeholder="Tu correo electrónico" value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="submit" aria-label="Subscribe"><ArrowIcon /></button>
            </form>
          )}
          <a
            className="text-link dark-link"
            href={buildWhatsAppUrl(getContent("contact_phone", "+376 653 769"), "Hola! Quisiera más información sobre las experiencias de iWE.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            O escríbenos directamente <ArrowIcon />
          </a>
        </div>
      </section>
    </main>
  );
}

export default Home;
