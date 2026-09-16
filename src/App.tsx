import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useSiteData } from "./context/SiteDataContext";
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
  const { theme, toggleTheme, fontScale, cycleFontScale, language, setLanguage } = usePreferences();
  const { navSections, getContent } = useSiteData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fontScaleLabel = { normal: "A", large: "A+", xlarge: "A++" }[fontScale];
  const contactAddress = getContent("contact_address", "Av. de Sant Antoni, 12, AD400 La Massana, Andorra");
  const contactPhone = getContent("contact_phone", "+376 344 870");
  const logoUrl = getContent("logo_url", "");

  return (
    <div className="site-shell bg-stone-50 text-ink">
      <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
        <Link className="brand-mark" to="/" aria-label="iWE Isard Wildland Experience home">
          {logoUrl ? (
            <img src={logoUrl} alt="iWE Isard Wildland Experience" className="brand-logo-image" />
          ) : (
            <span className="brand-logo-placeholder" aria-hidden="true">
              LOGO
            </span>
          )}
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navSections.map((section) => (
            <div className="nav-dropdown" key={section.label}>
              <a href={section.anchor}>{section.label}</a>
              {section.items.length > 0 && (
                <div className="nav-dropdown-menu">
                  {section.items.map((item) => (
                    <Link to={`/tour/${item.id}`} key={item.id}>{item.title}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a href="/#tours">Tours en Andorra</a>
          <Link to="/novedades">Novedades</Link>
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
                <a href={section.anchor} onClick={() => setMenuOpen(false)}>{section.label}</a>
                {section.items.length > 0 && (
                  <div className="mobile-nav-subitems">
                    {section.items.map((item) => (
                      <Link to={`/tour/${item.id}`} key={item.id} onClick={() => setMenuOpen(false)}>{item.title}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a href="/#tours" onClick={() => setMenuOpen(false)}>Tours en Andorra</a>
            <Link to="/novedades" onClick={() => setMenuOpen(false)}>Novedades</Link>
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
            <a href="/#contact">Contacto</a>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>© 2026 iWE — {getContent("business_name", "Isard Wildland Experience")}</span>
          <span>{contactAddress} · Tel: {contactPhone}</span>
          <div>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
