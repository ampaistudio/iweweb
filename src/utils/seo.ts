export interface SeoConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function updateSeo(config: SeoConfig = {}) {
  const title = config.title || "";
  const description = config.description ? sanitizeDescription(config.description) : "";
  const image = config.image || "";
  const url = config.url || (typeof window !== "undefined" ? window.location.href : "");
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
    setMetaTag("property", "og:site_name", title);

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
