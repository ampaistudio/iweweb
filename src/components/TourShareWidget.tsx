import { useState } from "react";
import { useSiteData } from "../context/SiteDataContext";

interface TourShareWidgetProps {
  title: string;
  type: string;
  region: string;
}

export function TourShareWidget({ title, type, region }: TourShareWidgetProps) {
  const { getContent } = useSiteData();
  const [copiedStatus, setCopiedStatus] = useState<"instagram" | "link" | null>(null);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Descubre "${title}" (${type}) en ${region} con iWE Andorra`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      }
      setCopiedStatus("link");
      setTimeout(() => setCopiedStatus(null), 3000);
    } catch {
      // Fallback
    }
  };

  const handleInstagramShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      }
      setCopiedStatus("instagram");
      setTimeout(() => setCopiedStatus(null), 3500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="tour-share-box">
      <div className="tour-share-header">
        <span className="tour-share-title">{getContent("tour_share_title", "Compartir experiencia")}</span>
        {copiedStatus && (
          <span className="tour-share-toast">
            {copiedStatus === "instagram"
              ? "✓ Enlace copiado para Instagram"
              : "✓ Enlace copiado al portapapeles"}
          </span>
        )}
      </div>
      <div className="tour-share-buttons">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tour-share-btn share-wa"
          title="Compartir en WhatsApp"
          aria-label="Compartir en WhatsApp"
        >
          <svg className="tour-share-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.21 8.21 0 0 1-5.82 2.41h-.01c-1.48 0-2.93-.39-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.24-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tour-share-btn share-fb"
          title="Compartir en Facebook"
          aria-label="Compartir en Facebook"
        >
          <svg className="tour-share-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
          <span>Facebook</span>
        </a>

        <button
          type="button"
          onClick={handleInstagramShare}
          className="tour-share-btn share-ig"
          title="Compartir en Instagram (copia enlace)"
          aria-label="Compartir en Instagram"
        >
          <svg className="tour-share-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          <span>Instagram</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="tour-share-btn share-copy"
          title="Copiar enlace al portapapeles"
          aria-label="Copiar enlace"
        >
          <svg className="tour-share-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>{copiedStatus === "link" ? "¡Copiado!" : "Copiar link"}</span>
        </button>
      </div>
    </div>
  );
}

