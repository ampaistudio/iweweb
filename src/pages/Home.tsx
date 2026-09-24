import { useEffect, useState } from "react";
import HeroSlideshow from "../components/HeroSlideshow";
import { useSiteData } from "../context/SiteDataContext";
import { usePreferences } from "../context/PreferencesContext";
import { publicApi } from "../api/client";
import type { Package } from "../api/types";
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
  const { language } = usePreferences();
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchPackages() {
      try {
        const pkgs = await publicApi.packages.list({ locale: language });
        if (isMounted && Array.isArray(pkgs)) {
          setPackages(pkgs);
        }
      } catch {
        // Transparent empty fallback
      }
    }
    fetchPackages();
    return () => {
      isMounted = false;
    };
  }, [language]);

  useEffect(() => {
    const title = getContent("seo_meta_title");
    const description = getContent("seo_meta_description");
    const image = getContent("seo_og_image");
    updateSeo({
      title,
      description,
      image: image || undefined,
    });
  }, [getContent]);

  const heroEyebrow = getContent("hero_eyebrow");
  const heroTitleLine1 = getContent("hero_title_line1");
  const heroTitleLine2 = getContent("hero_title_line2");
  const heroCopy = getContent("hero_copy");
  const heroTagline = getContent("hero_tagline");
  const missionEyebrow = getContent("mission_eyebrow");
  const missionTitle = getContent("mission_title");
  const missionText = getContent(
    "mission_text");
  const missionImage = getContent("mission_image");
  const teamEyebrow = getContent("team_eyebrow");
  const teamTitle = getContent("team_title");
  const teamBio = getContent(
    "team_bio");
  const teamImage = getContent("team_image");
  const teamImageNoteLine1 = getContent("team_image_note_line1");
  const teamImageNoteLine2 = getContent("team_image_note_line2");
  const toursPublished = getContent("tours_section_published") !== "false" && getContent("tours_section_published") !== "0";
  const toursEyebrow = getContent("tours_eyebrow");
  const toursTitleLine1 = getContent("tours_title_line1");
  const toursTitleLine2 = getContent("tours_title_line2");
  const toursCopy = getContent("tours_copy");
  const toursCtaText = getContent("tours_cta_text");

  const heroCtaActivities = getContent("hero_cta_activities");
  const heroCtaReserve = getContent("hero_cta_reserve");
  const contactPhone = getContent("contact_phone");
  const heroWhatsappUrl = buildWhatsAppUrl(contactPhone, "Hola! Quiero reservar una experiencia con iWE");
  const heroScrollHint = getContent("hero_scroll_hint");
  const missionTeamLink = getContent("mission_team_link");
  const missionStat1Value = getContent("mission_stat1_value");
  const missionStat1Label = getContent("mission_stat1_label");
  const missionStat2Value = getContent("mission_stat2_value");
  const missionStat2Label = getContent("mission_stat2_label");
  const missionStat3Value = getContent("mission_stat3_value");
  const missionStat3Label = getContent("mission_stat3_label");
  const teamContactLink = getContent("team_contact_link");

  const calendarHolidayLabel = getContent("calendar_holiday_label");
  const calendarEventsLabel = getContent("calendar_events_label");
  const calendarEventsName = getContent("calendar_events_name");
  const calendarEventsPlace = getContent("calendar_events_place");

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
            src={missionImage || undefined}
            alt="Roc del Quer, Andorra"
            loading="lazy"
            decoding="async"
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
            src={teamImage || undefined}
            alt="Equipo de iWE guiando una experiencia de montaña"
            loading="lazy"
            decoding="async"
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
              <div className="calendar-row" key={pkg.id}>
                <span className="calendar-month">{calendarHolidayLabel}</span>
                <span className="calendar-tour">{pkg.title}</span>
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
