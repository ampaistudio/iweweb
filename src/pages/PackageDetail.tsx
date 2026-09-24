import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { publicApi } from '../api/client';
import type { Package } from '../api/types';
import { usePreferences } from '../context/PreferencesContext';
import { useSiteData } from '../context/SiteDataContext';
import TourHero from '../components/TourHero';
import { TourShareWidget } from '../components/TourShareWidget';
import type { HeroSlide } from '../components/HeroSlideshow';
import { resolveMediaUrl } from '../utils/media';
import { buildReservationWhatsAppUrl } from '../utils/whatsapp';
import { updateSeo, setJsonLd } from '../utils/seo';

export default function PackageDetail() {
  const { packageId } = useParams<{ packageId: string }>();
  const { language } = usePreferences();
  const { getContent } = useSiteData();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setPkg(null);
    setLoading(true);
    if (packageId) {
      publicApi.packages.get(packageId, language)
        .then((result) => { if (active) setPkg(result); })
        .catch(() => { if (active) setPkg(null); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [packageId, language]);

  useEffect(() => {
    if (!pkg) return;
    updateSeo({ title: `${pkg.title} | iWE Andorra`, description: pkg.description, image: pkg.image_url || undefined, type: 'article' });
    setJsonLd({
      '@context': 'https://schema.org', '@type': 'TouristTrip', name: pkg.title,
      description: pkg.description, image: pkg.image_url ? resolveMediaUrl(pkg.image_url) : undefined,
      itinerary: pkg.itinerary?.length ? pkg.itinerary : undefined,
      offers: pkg.price_amount === null ? undefined : {
        '@type': 'Offer', price: pkg.price_amount, priceCurrency: pkg.price_currency || 'EUR',
        url: window.location.href,
      },
    });
    return () => setJsonLd(null);
  }, [pkg]);

  if (!packageId) return <Navigate to="/" replace />;
  if (loading) return <main className="tour-detail page-width section-space"><div className="news-loading-state"><div className="news-spinner" /></div></main>;
  if (!pkg) return <Navigate to="/" replace />;

  const slides: HeroSlide[] = [];
  if (pkg.image_url) slides.push({ type: 'image', src: resolveMediaUrl(pkg.image_url), alt: pkg.alt_text || pkg.title });
  pkg.media?.forEach((item) => slides.push(item.media_type === 'video'
    ? { type: 'video', src: resolveMediaUrl(item.media_url), poster: item.poster_url ? resolveMediaUrl(item.poster_url) : undefined, alt: item.alt_text || pkg.title }
    : { type: 'image', src: resolveMediaUrl(item.media_url), alt: item.alt_text || pkg.title }));

  const price = pkg.price_amount === null || pkg.price_amount === undefined
    ? getContent('tour_detail_consult_price')
    : `${pkg.price_amount} ${pkg.price_currency || 'EUR'}${pkg.price_unit ? ` · ${pkg.price_unit}` : ''}`;
  const bookingUrl = buildReservationWhatsAppUrl(getContent('contact_phone'), pkg.title);

  return (
    <main className="tour-detail-page">
      <TourHero slides={slides} title={pkg.title} eyebrow={pkg.group_label || pkg.duration} variant="full" />
      <div id="tour-content" className="page-width tour-detail-body">
        {(pkg.intro_title || pkg.intro_text) && <div className="tour-intro-section">
          {pkg.intro_title && <h2 className="tour-intro-title">{pkg.intro_title}</h2>}
          {pkg.intro_text && <p className="tour-intro-text">{pkg.intro_text}</p>}
        </div>}
        <div className="tour-detail-layout"><div className="tour-detail-copy">
          <div className="tour-specs-grid">
            <div className="tour-spec-item"><div><span className="tour-spec-label">{getContent('tour_detail_duration')}</span><span className="tour-spec-value">{pkg.duration}</span></div></div>
            <div className="tour-spec-item"><div><span className="tour-spec-label">{getContent('tour_detail_price')}</span><span className="tour-spec-value">{price}</span></div></div>
          </div>
          <div className="tour-description-wrap"><p>{pkg.description}</p></div>
          {Boolean(pkg.itinerary?.length) && <div className="tour-itinerary-section"><p className="tour-section-subtitle">{getContent('tour_detail_itinerary')}</p><ol className="tour-itinerary-list">{pkg.itinerary!.map((step, i) => <li key={i}>{step}</li>)}</ol></div>}
          {Boolean(pkg.highlights?.length) && <div className="tour-highlights-section"><p className="tour-section-subtitle">{getContent('tour_detail_highlights')}</p><div className="tour-highlights-grid">{pkg.highlights!.map((highlight, i) => <div className="tour-highlight-card" key={i}><span className="tour-highlight-check">✓</span><span className="tour-highlight-text">{highlight}</span></div>)}</div></div>}
          <TourShareWidget title={pkg.title} type={pkg.group_label || pkg.duration} region={getContent('contact_address')} />
          <div className="tour-booking-cta"><a className="button button-dark tour-booking-button" href={bookingUrl} target="_blank" rel="noopener noreferrer">{getContent('tour_detail_reserve_cta')}</a></div>
        </div></div>
      </div>
    </main>
  );
}
