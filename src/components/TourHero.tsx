import { Link } from "react-router-dom";
import HeroSlideshow, { type HeroSlide } from "./HeroSlideshow";
import { useSiteData } from "../context/SiteDataContext";

export interface TourHeroProps {
  slides: HeroSlide[];
  title: string;
  eyebrow: string;
  variant: "full" | "tall";
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 rotate-180"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M2 8h11M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 tour-scroll-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function TourHero({ slides, title, eyebrow, variant }: TourHeroProps) {
  const { getContent } = useSiteData();

  const handleScrollDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("tour-content");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
    }
  };

  return (
    <section className={`tour-hero tour-hero-${variant}`}>
      <HeroSlideshow slides={slides} />
      <div className="tour-hero-overlay-gradient" />

      {/* Top Floating Back Link */}
      <div className="tour-hero-top-bar page-width">
        <Link className="tour-hero-back" to="/">
          <ArrowLeftIcon /> Volver al inicio
        </Link>
      </div>

      {/* Hero Content Overlaid at Bottom */}
      <div className="tour-hero-content">
        <div className="page-width tour-hero-inner">
          <p className="eyebrow light-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>

      {/* Subtle Scroll Hint only on full-height variant */}
      {variant === "full" && (
        <a
          href="#tour-content"
          className="tour-hero-scroll-hint"
          onClick={handleScrollDown}
          aria-label="Descubre más sobre este tour"
        >
          <span>{getContent("tour_hero_scroll_hint")}</span>
          <ChevronDownIcon />
        </a>
      )}
    </section>
  );
}

export default TourHero;

