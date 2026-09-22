import { useEffect } from "react";
import { packages } from "../data/activities";
import HeroSlideshow from "../components/HeroSlideshow";
import { useSiteData } from "../context/SiteDataContext";
import { updateSeo } from "../utils/seo";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { HomeAdventuresSection } from "../components/home/HomeAdventuresSection";
import { HomeWeatherSection } from "../components/home/HomeWeatherSection";
import { HomeReviewsSection } from "../components/home/HomeReviewsSection";
import { HomeContactSection } from "../components/home/HomeContactSection";

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

function Home() {
  const { heroSlides, getContent } = useSiteData();

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
  const contactPhone = getContent("contact_phone", "+376 653 769");
  const heroWhatsappUrl = buildWhatsAppUrl(contactPhone, "Hola! Quiero reservar una experiencia con iWE");
  const heroScrollHint = getContent("hero_scroll_hint", "Descubre más");
  const missionTeamLink = getContent("mission_team_link", "Nuestro equipo");
  const missionStat1Value = getContent("mission_stat1_value", "2018");
  const missionStat1Label = getContent("mission_stat1_label", "año de fundación");
  const missionStat2Value = getContent("mission_stat2_value", "15+");
  const missionStat2Label = getContent("mission_stat2_label", "tipos de actividades");
  const missionStat3Value = getContent("mission_stat3_value", "2");
  const missionStat3Label = getContent("mission_stat3_label", "regiones: Andorra y Pirineos");
  const teamContactLink = getContent("team_contact_link", "Cómo trabajamos");

  const calendarHolidayLabel = getContent("calendar_holiday_label", "Holiday");
  const calendarEventsLabel = getContent("calendar_events_label", "Eventos");
  const calendarEventsName = getContent("calendar_events_name", "Team Building & Eventos Deportivos");
  const calendarEventsPlace = getContent("calendar_events_place", "Andorra");

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
            <a
              className="text-link light-link"
              href={heroWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {heroCtaReserve} <ArrowIcon />
            </a>
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

      <HomeAdventuresSection />

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

      <HomeWeatherSection />

      <HomeReviewsSection />

      <HomeContactSection />
    </main>
  );
}

export default Home;
