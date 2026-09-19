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
          <Link className="brand-mark footer-brand" to="/" aria-label="iWE Isard Wildland Experience home">
            <span className="brand-symbol">i<span>WE</span></span>
            <span className="brand-name">Wildland Experience</span>
          </Link>
          <p>Turismo activo y experiencias de montaña<br />en Andorra y los Pirineos.</p>
          <div className="footer-links">
            <a href="/#bike">Bike</a>
            <a href="/#tours">Tours en Andorra</a>
            <Link to="/novedades">Novedades</Link>
            <a href="/#stories">Opiniones</a>
            <Link to="/privacidad">Privacidad</Link>
            <a href="/#contact">Contacto</a>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>© 2026 iWE — {getContent("business_name", "Isard Wildland Experience")}</span>
          <span>{contactAddress} · Tel: {contactPhone}</span>
          <div className="footer-socials">
            {[
              { label: "Instagram", url: getContent("social_instagram", "https://www.instagram.com/isardwildland/") },
              { label: "Facebook", url: getContent("social_facebook", "https://www.facebook.com/isardwildland/") },
              { label: "YouTube", url: getContent("social_youtube", "") },
              { label: "TikTok", url: getContent("social_tiktok", "") },
              { label: "TripAdvisor", url: getContent("social_tripadvisor", "") },
              { label: "Strava", url: getContent("social_strava", "") },
            ]
              .filter((item) => item.url && item.url.trim() !== "")
              .map((item) => (
                <a key={item.label} href={item.url} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
          </div>
        </div>
        <div className="page-width footer-credit">
          <a href="https://www.nodoai.co" target="_blank" rel="noreferrer">Powered by NODO Ai Agency</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
