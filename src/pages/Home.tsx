import { useState } from "react";
import { Link } from "react-router-dom";
import { activities, packages, reviews } from "../data/activities";
import HeroSlideshow, { type HeroSlide } from "../components/HeroSlideshow";

const heroSlides: HeroSlide[] = [
  {
    type: "image",
    src: "https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg",
    alt: "Guía de montaña de iWE en los Pirineos de Andorra",
  },
  {
    type: "image",
    src: "https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg",
    alt: "E-Bike Enduro en Forn de Canillo",
  },
  {
    type: "image",
    src: "https://i-wildland.com/wp-content/uploads/2020/05/IMG_20180724_171459-800x533.jpg",
    alt: "Excursión 4x4 en la ruta de los contrabandistas hacia Tor",
  },
];

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

function ActivityGrid({ type }: { type: (typeof activities)[number]["type"] }) {
  return (
    <div className="tour-grid">
      {activities
        .filter((activity) => activity.type === type)
        .map((activity) => (
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

function Home() {
  const [reviewIndex, setReviewIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  const moveReview = (direction: number) => {
    setReviewIndex((current) => (current + direction + reviews.length) % reviews.length);
  };

  return (
    <main id="top">
      <section className="hero-section">
        <HeroSlideshow slides={heroSlides} />
        <div className="hero-overlay" />
        <div className="hero-content page-width">
          <p className="eyebrow light-eyebrow">Elige tu experiencia con nosotros</p>
          <h1>Todas las experiencias.<br /><em>Un solo operador.</em></h1>
          <p className="hero-copy">iWE, la agencia líder en turismo de experiencias. Esquí, snowboard, raquetas de nieve, BTT, 4x4, vía ferrata, senderismo y mucho más en Andorra y los Pirineos, todo el año.</p>
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
          <span className="image-caption">Fabricamos experiencias.</span>
        </div>
        <div className="mission-copy">
          <p className="eyebrow">Nuestra empresa</p>
          <h2>Líderes en turismo de experiencias en Andorra y los Pirineos.</h2>
          <p className="large-copy">Descubre un mundo de experiencias únicas con un solo operador turístico. Esquí, snowboard, raquetas de nieve, tours culturales y todo lo que te puedas imaginar para vivir la montaña, guiado por expertos locales como Charly Paredes.</p>
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
          <p className="eyebrow">Nuestro equipo</p>
          <h2>Fundada en 2018.<br /><em>Guiada por expertos locales.</em></h2>
          <p>iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2 (EFPEM Andorra), instructor de esquí certificado por AADIDES/ISIA y miembro de UIMLA y AGAMA. Formado entre Ushuaia y Andorra, habla catalán, español, francés e inglés.</p>
          <p>Cada ruta está pensada para adaptarse a tu nivel físico y técnico, sea que viajes en familia, en pareja o con amigos. Tú pones la curiosidad. Nosotros nos ocupamos del resto.</p>
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
          <ActivityGrid type="BTT" />
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
          <ActivityGrid type="Vía Ferrata" />
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
          <ActivityGrid type="4x4" />
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
          <ActivityGrid type="Senderismo" />
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
          <ActivityGrid type="Esquí-Snow" />
        </div>
      </section>

      <section id="tours" className="calendar-section section-space page-width">
        <div className="calendar-intro">
          <p className="eyebrow">Tours en Andorra</p>
          <h2>Vacaciones<br /><em>completas con iWE.</em></h2>
          <p>Combina alojamiento, guías y actividades en un solo paquete. Ideal para grupos, familias y viajes de aventura sin preocuparte por la logística.</p>
          <a className="button button-dark" href="#contact">Consultar disponibilidad <ArrowIcon /></a>
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

      <section id="stories" className="reviews-section section-space">
        <div className="page-width reviews-layout">
          <div className="reviews-label">
            <p className="eyebrow">Opiniones de clientes</p>
            <span className="review-count">0{reviewIndex + 1}<small>/0{reviews.length}</small></span>
          </div>
          <div className="review-content">
            <blockquote>{reviews[reviewIndex].quote}</blockquote>
            <div className="review-byline"><strong>{reviews[reviewIndex].name}</strong><span>{reviews[reviewIndex].location} / {reviews[reviewIndex].tour}</span></div>
            <div className="review-controls">
              <button type="button" aria-label="Previous review" onClick={() => moveReview(-1)}><ArrowIcon direction="left" /></button>
              <button type="button" aria-label="Next review" onClick={() => moveReview(1)}><ArrowIcon /></button>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section section-space page-width">
        <div>
          <p className="eyebrow">Mantente inspirado</p>
          <h2>Más montaña.<br /><em>Menos rutina.</em></h2>
        </div>
        <div className="contact-copy">
          <p>Recibe novedades, disponibilidad de actividades y un poco de inspiración para tu próxima aventura. Sin ruido. Solo lo bueno.</p>
          {subscribed ? (
            <p className="success-message">Ya formas parte de la lista. Nos vemos en la montaña.</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <label className="sr-only" htmlFor="email">Tu correo electrónico</label>
              <input id="email" type="email" required placeholder="Tu correo electrónico" value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="submit" aria-label="Subscribe"><ArrowIcon /></button>
            </form>
          )}
          <a className="text-link dark-link" href="mailto:info@i-wildland.com">O escríbenos directamente <ArrowIcon /></a>
        </div>
      </section>
    </main>
  );
}

export default Home;
