import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useSiteData, isNavGroup } from "./context/SiteDataContext";
import { languages, usePreferences } from "./context/PreferencesContext";

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

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4M15.7 15.7l-1.4-1.4M5.7 5.7L4.3 4.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 12.3A7 7 0 0 1 7.7 3a7 7 0 1 0 9.3 9.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SocialIcon({ name }: { name: string }) {
  switch (name.toLowerCase()) {
    case "instagram":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="social-svg">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "facebook":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.54l5.7 3.24-5.7 3.24z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.127V9.35a6.33 6.33 0 0 0-.87-.06 6.34 6.34 0 1 0 6.34 6.34V9.2a8.16 8.16 0 0 0 4.77 1.52V7.27a4.85 4.85 0 0 1-1-.58z" />
        </svg>
      );
    case "tripadvisor":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M12 4c-5.5 0-10 2.24-10 5 0 1.25.93 2.4 2.5 3.32-.4 1.15-.9 2.3-1.5 3.46 2.4-.7 4.5-1.78 6.2-3.15.9.24 1.8.37 2.8.37 1 0 1.9-.13 2.8-.37 1.7 1.37 3.8 2.45 6.2 3.15-.6-1.16-1.1-2.31-1.5-3.46 1.57-.92 2.5-2.07 2.5-3.32 0-2.76-4.5-5-10-5zm-5 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      );
    case "strava":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.925 15.688h4.172" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.38 9.74V9.93H5.08v8.57h2.76z" />
        </svg>
      );
    case "twitter":
    case "x":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-svg">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const location = useLocation();
  const { theme, toggleTheme, fontScale, cycleFontScale, language, setLanguage } = usePreferences();
  const { navSections, getContent } = useSiteData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDarkHero = (location.pathname === "/" || location.pathname.startsWith("/tour/")) && !scrolled;
  const headerVariantClass = isDarkHero ? "site-header-hero" : "site-header-default";

  const fontScaleLabel = { normal: "A", large: "A+", xlarge: "A++" }[fontScale];
  const contactAddress = getContent("contact_address", "Av. de Sant Antoni, 12, AD400 La Massana, Andorra");
  const contactPhone = getContent("contact_phone", "+376 653 769");
  const logoUrl = getContent("logo_url", "");
  const logoHeight = getContent("logo_height", "44");
  const logoHeightNum = parseInt(logoHeight, 10) || 44;
  const currentLogoHeight = scrolled ? Math.min(logoHeightNum, 52) : logoHeightNum;
  const logoStyle = { height: `${currentLogoHeight}px`, maxHeight: scrolled ? "52px" : "120px" };

  return (
    <div className="site-shell">
      <header className={`site-header ${headerVariantClass} ${scrolled ? "site-header-scrolled" : ""}`}>
        <Link className="brand-mark" to="/" aria-label="iWE Isard Wildland Experience home">
          {logoUrl ? (
            <img src={logoUrl} alt="iWE Isard Wildland Experience" className="brand-logo-image" style={logoStyle} />
          ) : (
            <span className="brand-logo-placeholder" aria-hidden="true" style={logoStyle}>
              <span className="brand-logo-symbol">iWE</span>
              <span className="brand-logo-sub">ANDORRA</span>
            </span>
          )}
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navSections.map((section) => (
            <div className="nav-dropdown" key={section.label}>
              {section.anchor.startsWith('/') && !section.anchor.includes('#') ? (
                <Link to={section.anchor}>{section.label}</Link>
              ) : (
                <a href={section.anchor}>{section.label}</a>
              )}
              {section.items.length > 0 && (
                <div className="nav-dropdown-menu">
                  {section.items.map((item, idx) => {
                    if (isNavGroup(item)) {
                      const groupKey = `${section.label}:${item.label}`;
                      const isOpen = openGroups.has(groupKey);
                      return (
                        <div key={item.label || idx} className="nav-dropdown-group">
                          <button
                            type="button"
                            className="nav-dropdown-subheading"
                            aria-expanded={isOpen}
                            onClick={() => toggleGroup(groupKey)}
                          >
                            {item.label}
                            <ArrowIcon direction={isOpen ? "left" : "right"} />
                          </button>
                          {isOpen && (
                            <div className="nav-dropdown-nested">
                              {item.items.map((leaf) =>
                                leaf.href.startsWith('/') && !leaf.href.includes('#') ? (
                                  <Link to={leaf.href} key={leaf.id || leaf.href}>
                                    {leaf.title}
                                  </Link>
                                ) : (
                                  <a href={leaf.href} key={leaf.id || leaf.href}>
                                    {leaf.title}
                                  </a>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return item.href.startsWith('/') && !item.href.includes('#') ? (
                      <Link to={item.href} key={item.id || item.href}>
                        {item.title}
                      </Link>
                    ) : (
                      <a href={item.href} key={item.id || item.href}>
                        {item.title}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>


        <div className="header-actions">
          <div className="preferences-controls">
            <button
              type="button"
              className="preferences-button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
              title={theme === "light" ? "Modo oscuro" : "Modo claro"}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
            <button
              type="button"
              className="preferences-button preferences-font-button"
              onClick={cycleFontScale}
              aria-label="Cambiar tamaño de tipografía"
              title="Tamaño de tipografía"
            >
              {fontScaleLabel}
            </button>
            <select
              className="preferences-language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              aria-label="Seleccionar idioma"
              title="Idioma"
            >
              {languages.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <a className="header-contact" href="/#contact">Contacto <ArrowIcon /></a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navSections.map((section) => (
              <div className="mobile-nav-group" key={section.label}>
                {section.anchor.startsWith('/') && !section.anchor.includes('#') ? (
                  <Link to={section.anchor} onClick={() => setMenuOpen(false)}>
                    {section.label}
                  </Link>
                ) : (
                  <a href={section.anchor} onClick={() => setMenuOpen(false)}>
                    {section.label}
                  </a>
                )}
                {section.items.length > 0 && (
                  <div className="mobile-nav-subitems">
                    {section.items.map((item, idx) => {
                      if (isNavGroup(item)) {
                        const groupKey = `${section.label}:${item.label}`;
                        const isOpen = openGroups.has(groupKey);
                        return (
                          <div key={item.label || idx} className="mobile-nav-nested-group">
                            <button
                              type="button"
                              className="mobile-nav-subheading"
                              aria-expanded={isOpen}
                              onClick={() => toggleGroup(groupKey)}
                            >
                              {item.label}
                              <ArrowIcon direction={isOpen ? "left" : "right"} />
                            </button>
                            {isOpen && (
                              <div className="mobile-nav-nested">
                                {item.items.map((leaf) =>
                                  leaf.href.startsWith('/') && !leaf.href.includes('#') ? (
                                    <Link
                                      to={leaf.href}
                                      key={leaf.id || leaf.href}
                                      onClick={() => setMenuOpen(false)}
                                    >
                                      {leaf.title}
                                    </Link>
                                  ) : (
                                    <a
                                      href={leaf.href}
                                      key={leaf.id || leaf.href}
                                      onClick={() => setMenuOpen(false)}
                                    >
                                      {leaf.title}
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return item.href.startsWith('/') && !item.href.includes('#') ? (
                        <Link
                          to={item.href}
                          key={item.id || item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          key={item.id || item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.title}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <a href="/#contact" onClick={() => setMenuOpen(false)}>Contacto <ArrowIcon /></a>
          </nav>
        )}

      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="page-width footer-top">
          <div className="footer-col footer-col-brand">
            <Link className="brand-mark footer-brand" to="/" aria-label="iWE Isard Wildland Experience home">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={getContent("business_name", "Isard Wildland Experience")}
                  className="footer-logo-image"
                />
              ) : (
                <>
                  <span className="brand-symbol">i<span>WE</span></span>
                  <span className="brand-name">Wildland Experience</span>
                </>
              )}
            </Link>
            <p className="footer-brand-desc">
              {getContent(
                "footer_brand_desc",
                "Turismo activo y experiencias de montaña en Andorra y los Pirineos."
              )}
            </p>
            <div className="footer-contact-details">
              <span>{contactAddress}</span>
              <span>Tel: {contactPhone}</span>
            </div>
          </div>

          <div className="footer-col footer-col-links">
            <h4 className="footer-heading">{getContent("footer_nav_heading", "Navegación")}</h4>
            <div className="footer-links">
              <a href="/#bike">Bike</a>
              <a href="/#tours">Tours en Andorra</a>
              <Link to="/novedades">Novedades</Link>
              <a href="/#stories">Opiniones</a>
              <Link to="/privacidad">Privacidad</Link>
              <a href="/#contact">Contacto</a>
            </div>
          </div>

          <div className="footer-col footer-col-social">
            <h4 className="footer-heading">{getContent("footer_social_heading", "Síguenos")}</h4>
            <p className="footer-social-desc">
              {getContent("footer_social_desc", "Conéctate con nuestra comunidad en la montaña:")}
            </p>
            <div className="footer-social-grid">
              {[
                { label: "Instagram", url: getContent("social_instagram", "https://www.instagram.com/isardwildland/") },
                { label: "Facebook", url: getContent("social_facebook", "https://www.facebook.com/isardwildland/") },
                { label: "TripAdvisor", url: getContent("social_tripadvisor", "https://www.tripadvisor.com/") },
                { label: "WhatsApp", url: getContent("social_whatsapp", "") },
                { label: "YouTube", url: getContent("social_youtube", "") },
                { label: "TikTok", url: getContent("social_tiktok", "") },
                { label: "Strava", url: getContent("social_strava", "") },
                { label: "LinkedIn", url: getContent("social_linkedin", "") },
                { label: "X / Twitter", url: getContent("social_twitter", "") },
              ]
                .filter((item) => item.url && item.url.trim() !== "")
                .map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social-badge"
                    aria-label={`Seguir en ${item.label}`}
                  >
                    <SocialIcon name={item.label.includes("Twitter") || item.label.includes("X") ? "x" : item.label} />
                    <span>{item.label}</span>
                  </a>
                ))}
            </div>
          </div>
        </div>

        <div className="page-width footer-bottom">
          <span>© 2026 iWE — {getContent("business_name", "Isard Wildland Experience")}</span>
          <span>{contactAddress} · Tel: {contactPhone}</span>
        </div>
        <div className="page-width footer-credit">
          <a href="https://www.nodoai.co" target="_blank" rel="noreferrer">Powered by NODO Ai Agency</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
