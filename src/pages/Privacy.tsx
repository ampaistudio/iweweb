import { createElement, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSiteData } from "../context/SiteDataContext";
import { updateSeo } from "../utils/seo";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 rotate-180" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h11M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function PolicyText({ text }: { text: string }) {
  if (text.trimStart().startsWith("<")) {
    if (typeof DOMParser === "undefined") return <p>{text.replace(/<[^>]*>/g, "")}</p>;
    const parsed = new DOMParser().parseFromString(text, "text/html");
    const allowed = new Set(["h2", "h3", "p", "br", "ul", "ol", "li", "strong", "em"]);
    const renderNode = (node: Node, key: number): ReactNode => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return null;
      const tag = node.nodeName.toLowerCase();
      if (tag === "script" || tag === "style") return null;
      const children = Array.from(node.childNodes).map((child, index) => renderNode(child, index));
      return allowed.has(tag)
        ? createElement(tag, { key }, ...children)
        : createElement("span", { key }, ...children);
    };
    return <div className="news-article-content" style={{ fontSize: "16px", lineHeight: "1.7" }}>
      {Array.from(parsed.body.childNodes).map((node, index) => renderNode(node, index))}
    </div>;
  }

  return (
    <div className="news-article-content" style={{ fontSize: "16px", lineHeight: "1.7" }}>
      {text.split(/\n\s*\n/).map((block, index) => {
        const lines = block.trim().split("\n");
        if (!block.trim()) return null;
        if (lines.length === 1 && lines[0].startsWith("## ")) {
          return <h2 key={index} style={{ fontSize: "24px", margin: "36px 0 14px" }}>{lines[0].slice(3)}</h2>;
        }
        if (lines.every((line) => line.startsWith("- "))) {
          return <ul key={index} style={{ paddingLeft: "24px", marginBottom: "16px" }}>
            {lines.map((line, itemIndex) => <li key={itemIndex}>{line.slice(2)}</li>)}
          </ul>;
        }
        return <p key={index} style={{ marginBottom: "16px", whiteSpace: "pre-line" }}>{block.trim()}</p>;
      })}
    </div>
  );
}

function Privacy() {
  const { content, loading } = useSiteData();
  const policyText = content.privacy_policy_text?.trim() || "";
  const title = content.privacy_policy_title?.trim() || "";
  const eyebrow = content.privacy_policy_eyebrow?.trim() || "";
  const description = content.privacy_policy_seo_description?.trim() || "";

  useEffect(() => {
    updateSeo({
      title: title || "Contenido no disponible",
      description,
    });
  }, [title, description]);

  return (
    <main className="tour-detail page-width">
      <div className="tour-detail-back">
        <Link className="text-link dark-link" to="/">
          <ArrowIcon /> Volver al inicio
        </Link>
      </div>
      <div className="news-article" style={{ maxWidth: "880px", marginInline: "auto" }}>
        <header className="news-article-header" style={{ marginBottom: "48px" }}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: "1.05", marginBottom: "16px" }}>
            {title}
          </h1>
        </header>
        {loading ? <p>Cargando política de privacidad...</p> : policyText ? (
          <PolicyText text={policyText} />
        ) : <p>La política de privacidad no está disponible en este momento.</p>}
      </div>
    </main>
  );
}

export default Privacy;
