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
    default:
      return null;
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
  const contactPhone = getContent("contact_phone", "+376 344 870");
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
                      return (
                        <div key={item.label || idx} className="nav-dropdown-group">
                          <span className="nav-dropdown-subheading">{item.label}</span>
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
                        return (
                          <div key={item.label || idx} className="mobile-nav-nested-group">
                            <span className="mobile-nav-subheading">{item.label}</span>
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
              <span className="brand-symbol">i<span>WE</span></span>
              <span className="brand-name">Wildland Experience</span>
            </Link>
            <p className="footer-brand-desc">Turismo activo y experiencias de montaña en Andorra y los Pirineos.</p>
            <div className="footer-contact-details">
              <span>{contactAddress}</span>
              <span>Tel: {contactPhone}</span>
            </div>
          </div>

          <div className="footer-col footer-col-links">
            <h4 className="footer-heading">Navegación</h4>
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
            <h4 className="footer-heading">Síguenos</h4>
            <p className="footer-social-desc">Conéctate con nuestra comunidad en la montaña:</p>
            <div className="footer-social-grid">
              {[
                { label: "Instagram", url: getContent("social_instagram", "https://www.instagram.com/isardwildland/") },
                { label: "Facebook", url: getContent("social_facebook", "https://www.facebook.com/isardwildland/") },
                { label: "YouTube", url: getContent("social_youtube", "") },
                { label: "TikTok", url: getContent("social_tiktok", "") },
                { label: "TripAdvisor", url: getContent("social_tripadvisor", "https://www.tripadvisor.com/") },
                { label: "Strava", url: getContent("social_strava", "") },
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
                    <SocialIcon name={item.label} />
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
