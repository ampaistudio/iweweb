import { useState } from "react";
import { useSiteData } from "../../context/SiteDataContext";
import { publicApi } from "../../api/client";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

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

export function HomeContactSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const { getContent } = useSiteData();

  const handleNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || submittingNewsletter) return;

    setSubmittingNewsletter(true);
    setNewsletterError(null);

    try {
      await publicApi.newsletter.subscribe(cleanEmail);
      setSubscribed(true);
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar la suscripción. Inténtalo de nuevo.";
      setNewsletterError(msg);
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const contactEyebrow = getContent("contact_eyebrow");
  const contactTitleLine1 = getContent("contact_title_line1");
  const contactTitleLine2 = getContent("contact_title_line2");
  const contactCopy = getContent("contact_copy");
  const newsletterSuccessMessage = getContent("newsletter_success_message");
  const newsletterEmailLabel = getContent("newsletter_email_label");
  const contactWhatsappLink = getContent("contact_whatsapp_link");
  const contactPhone = getContent("contact_phone");

  return (
    <section id="contact" className="contact-section section-space page-width">
      <div>
        <p className="eyebrow">{contactEyebrow}</p>
        <h2>{contactTitleLine1}<br /><em>{contactTitleLine2}</em></h2>
      </div>
      <div className="contact-copy">
        <p>{contactCopy}</p>
        {subscribed ? (
          <p className="success-message">{newsletterSuccessMessage}</p>
        ) : (
          <>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <label className="sr-only" htmlFor="email">{newsletterEmailLabel}</label>
              <input
                id="email"
                type="email"
                required
                placeholder={newsletterEmailLabel}
                value={email}
                disabled={submittingNewsletter}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="submit" aria-label="Subscribe" disabled={submittingNewsletter}>
                <ArrowIcon />
              </button>
            </form>
            {newsletterError && <p className="newsletter-error-message">{newsletterError}</p>}
          </>
        )}
        <a
          className="text-link dark-link"
          href={buildWhatsAppUrl(contactPhone, "Hola! Quisiera más información sobre las experiencias de iWE.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          {contactWhatsappLink} <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

