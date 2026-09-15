import { useEffect, useState } from "react";

export type HeroSlide =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; alt: string };

const AUTO_ADVANCE_MS = 7000;

function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-slideshow">
      {slides.map((slide, index) => (
        <div className={`hero-slide ${index === activeIndex ? "hero-slide-active" : ""}`} key={slide.src}>
          {slide.type === "video" ? (
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
          ) : (
            <img className="hero-image" src={slide.src} alt={slide.alt} />
          )}
        </div>
      ))}

      {slides.length > 1 && (
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
      )}
    </div>
  );
}

export default HeroSlideshow;
