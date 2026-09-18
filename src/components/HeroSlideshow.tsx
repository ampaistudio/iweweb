import { useEffect, useState } from "react";

export type HeroSlide =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; alt: string };

const AUTO_ADVANCE_MS = 7000;

function getYoutubeEmbedUrl(src: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = src.match(pattern);
    if (match) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1`;
    }
  }
  return null;
}

function getVimeoEmbedUrl(src: string): string | null {
  const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`;
  }
  return null;
}

function getEmbedUrl(src: string): string | null {
  return getYoutubeEmbedUrl(src) || getVimeoEmbedUrl(src);
}

function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className="hero-slideshow">
      {slides.map((slide, index) => (
        <div className={`hero-slide ${index === activeIndex ? "hero-slide-active" : ""}`} key={slide.src}>
          {slide.type === "video" ? (
            (() => {
              const embedUrl = getEmbedUrl(slide.src);
              return embedUrl ? (
                <iframe
                  className="hero-image hero-video-embed"
                  src={embedUrl}
                  title={slide.alt}
                  allow="autoplay; encrypted-media"
                  frameBorder={0}
                />
              ) : (
                <video
                  className="hero-image"
                  src={slide.src}
                  poster={slide.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={slide.alt}
                />
              );
            })()
          ) : (
            <img className="hero-image" src={slide.src} alt={slide.alt} />
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="hero-slideshow-arrow hero-slideshow-arrow-prev"
            aria-label="Diapositiva anterior"
            onClick={goToPrevious}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="hero-slideshow-arrow hero-slideshow-arrow-next"
            aria-label="Diapositiva siguiente"
            onClick={goToNext}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="hero-slideshow-dots" role="tablist" aria-label="Seleccionar diapositiva">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Ir a la diapositiva ${index + 1}`}
                className={`hero-slideshow-dot ${index === activeIndex ? "hero-slideshow-dot-active" : ""}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroSlideshow;
