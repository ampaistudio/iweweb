import { useState, useEffect, useMemo } from "react";
import { useSiteData } from "../../context/SiteDataContext";
import { publicApi } from "../../api/client";
import type { UnifiedReview } from "../../api/types";

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

export function HomeReviewsSection() {
  const [platformReviews, setPlatformReviews] = useState<UnifiedReview[]>([]);
  const [isGoogleMock, setIsGoogleMock] = useState(true);
  const [isTripadvisorMock, setIsTripadvisorMock] = useState(true);
  const [selectedSource, setSelectedSource] = useState<"all" | "google" | "tripadvisor" | "direct">("all");
  const [reviewIndex, setReviewIndex] = useState(0);
  const { getContent } = useSiteData();

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

  const reviewsEyebrow = getContent("reviews_eyebrow", "Opiniones de clientes");
  const reviewsTabAll = getContent("reviews_tab_all", "Todas");
  const reviewsTabGoogle = getContent("reviews_tab_google", "Google ★ 4.9");
  const reviewsTabTripadvisor = getContent("reviews_tab_tripadvisor", "TripAdvisor ★ 5.0");
  const reviewsTabDirect = getContent("reviews_tab_direct", "iWE");

  if (!(isGoogleVisible || isTripadvisorVisible || isDirectVisible) || visibleAllReviews.length === 0) {
    return null;
  }

  return (
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
  );
}

