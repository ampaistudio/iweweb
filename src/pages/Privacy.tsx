import { Link } from "react-router-dom";

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

function Privacy() {
  return (
    <main className="tour-detail page-width">
      <div className="tour-detail-back">
        <Link className="text-link dark-link" to="/">
          <ArrowIcon direction="left" /> Volver al inicio
        </Link>
      </div>

      <div className="news-article" style={{ maxWidth: "880px", marginInline: "auto" }}>
        <header className="news-article-header" style={{ marginBottom: "48px" }}>
          <p className="eyebrow">Aviso Legal &amp; Privacidad</p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: "1.05", marginBottom: "16px" }}>
            Política de Privacidad
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Última actualización: 17 de septiembre de 2026 • Principat d'Andorra
          </p>
        </header>

        <div className="news-article-content" style={{ fontSize: "16px", lineHeight: "1.7" }}>
          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>1. Responsable del Tratamiento</h2>
            <p>
              El presente sitio web (<strong>i-wildland.com</strong>) es operado bajo la marca comercial{" "}
              <strong>iWE — Isard Wildland Experience</strong>.
            </p>
            <div
              style={{
                background: "var(--sand)",
                padding: "20px 24px",
                borderRadius: "4px",
                border: "1px solid var(--line)",
                marginBottom: "20px",
                fontSize: "15px",
              }}
            >
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Denominación comercial:</strong> Isard Wildland Experience (iWE)
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Titularidad legal / Razón social:</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  [PENDIENTE: confirmar razón social legal con Christian]
                </span>{" "}
                <em>(Registrado provisionalmente en el sistema como Isard Wildland / Charly Paredes)</em>
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Domicilio social:</strong> Av. de Sant Antoni, 12, AD400 La Massana, Principat d'Andorra
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Teléfono de contacto:</strong> +376-653-769
              </p>
              <p style={{ margin: 0 }}>
                <strong>Correo electrónico de privacidad:</strong>{" "}
                <a href="mailto:info@i-wildland.com" style={{ color: "inherit", textDecoration: "underline" }}>
                  info@i-wildland.com
                </a>
              </p>
            </div>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>2. Normativa Aplicable</h2>
            <p>
              Esta política de privacidad ha sido elaborada en estricto cumplimiento de la legislación vigente en materia de
              protección de datos personales:
            </p>
            <ul style={{ paddingLeft: "24px", marginBottom: "16px" }}>
              <li style={{ marginBottom: "8px" }}>
                <strong>LQPD:</strong> Ley 29/2021, del 28 de octubre, Cualificada de Protección de Datos Personales del
                Principat d'Andorra, y sus reglamentos de desarrollo.
              </li>
              <li>
                <strong>RGPD:</strong> Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, relativo a la
                protección de las personas físicas respecto al tratamiento de datos personales y a la libre circulación de
                estos datos.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>3. Datos que Recopilamos y Finalidad</h2>
            <p>
              Tratamos los datos personales que nos facilitas a través de los formularios de contacto, reservas de tours y
              suscripciones informativas:
            </p>
            <ul style={{ paddingLeft: "24px", marginBottom: "16px" }}>
              <li style={{ marginBottom: "8px" }}>
                <strong>Datos identificativos y de contacto:</strong> Nombre, apellidos, correo electrónico, teléfono y país
                de procedencia, utilizados para responder a tus consultas, coordinar actividades y gestionar reservas de
                experiencias guiadas.
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>Datos de actividad y nivel técnico:</strong> Información sobre nivel físico, experiencia previa en
                montaña o requerimientos específicos para garantizar la máxima seguridad durante las rutas.
              </li>
              <li>
                <strong>Comunicaciones:</strong> Mensajes y comentarios remitidos para presupuestos de viajes a medida,
                paquetes multi-día o eventos de team building corporativo.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>4. Base Jurídica y Conservación</h2>
            <p>
              La base legal para el tratamiento de tus datos es la ejecución de medidas precontractuales o contractuales
              al solicitar información o contratar una actividad, así como el consentimiento explícito otorgado al enviar
              formularios de consulta.
            </p>
            <p>
              Los datos personales se conservarán durante el tiempo estrictamente necesario para cumplir con las finalidades
              para las que fueron recabados y mientras existan obligaciones legales aplicables en el Principat d'Andorra.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>5. Derechos de los Usuarios</h2>
            <p>
              De acuerdo con la LQPD y el RGPD, puedes ejercer en cualquier momento tus derechos de acceso, rectificación,
              supresión, limitación del tratamiento, portabilidad y oposición:
            </p>
            <p>
              Para ejercer cualquiera de estos derechos, puedes enviar una solicitud escrita acompañada de una copia de tu
              documento de identidad a{" "}
              <a href="mailto:info@i-wildland.com" style={{ color: "inherit", textDecoration: "underline" }}>
                info@i-wildland.com
              </a>{" "}
              o a nuestra dirección postal en Av. de Sant Antoni 12, AD400 La Massana, Andorra. Asimismo, tienes derecho a
              presentar una reclamación ante la Agencia Andorrana de Protección de Datos (APDA) si consideras vulnerados tus
              derechos.
            </p>
          </section>

          <section style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "14px" }}>6. Seguridad y Confidencialidad</h2>
            <p>
              iWE implementa las medidas técnicas y organizativas necesarias para garantizar la confidencialidad, integridad
              y disponibilidad de tus datos personales, evitando su alteración, pérdida o acceso no autorizado.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Privacy;

