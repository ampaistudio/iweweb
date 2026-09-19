export interface SeoConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra";
const DEFAULT_DESCRIPTION =
  "Descubre experiencias únicas en Andorra y los Pirineos con guías expertos: BTT, E-Bike Enduro, Vía Ferrata, 4x4, Senderismo, Esquí Tour y Raquetas de Nieve.";
const DEFAULT_IMAGE = "https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg";

export function updateSeo(config: SeoConfig = {}) {
  const title = config.title ? `${config.title}` : DEFAULT_TITLE;
  const description = config.description ? sanitizeDescription(config.description) : DEFAULT_DESCRIPTION;
  const image = config.image || DEFAULT_IMAGE;
  const url = config.url || (typeof window !== "undefined" ? window.location.href : "https://i-wildland.com");
  const type = config.type || "website";

  // Document Title
  if (typeof document !== "undefined") {
    document.title = title;

    // Meta Description
    setMetaTag("name", "description", description);

    // OpenGraph
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", image);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:site_name", "iWE — Isard Wildland Experience");

    // Twitter Card
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", image);
  }
}

function sanitizeDescription(text: string, maxLength: number = 160): string {
  const plain = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + "...";
}

function setMetaTag(attrName: "name" | "property", attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function setJsonLd(schema: object | null) {
  if (typeof document === "undefined") return;
  const scriptId = "dynamic-jsonld";
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!schema) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

