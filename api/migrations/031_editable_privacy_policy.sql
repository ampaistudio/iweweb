-- Make the existing privacy policy editable through site_content.
-- Existing edits are preserved when this migration is re-run.
INSERT INTO site_content (content_key, content_value, updated_at)
VALUES ('privacy_policy_text', 'Última actualización: 17 de septiembre de 2026 • Principat d''Andorra

## 1. Responsable del Tratamiento

El presente sitio web (i-wildland.com) es operado bajo la marca comercial iWE — Isard Wildland Experience.

Denominación comercial: Isard Wildland Experience (iWE)
Titularidad legal / Razón social: [PENDIENTE: confirmar razón social legal con Christian] (Registrado provisionalmente en el sistema como Isard Wildland / Charly Paredes)
Domicilio social: Av. de Sant Antoni, 12, AD400 La Massana, Principat d''Andorra
Teléfono de contacto: +376-653-769
Correo electrónico de privacidad: info@i-wildland.com

## 2. Normativa Aplicable

Esta política de privacidad ha sido elaborada en estricto cumplimiento de la legislación vigente en materia de protección de datos personales:

- LQPD: Ley 29/2021, del 28 de octubre, Cualificada de Protección de Datos Personales del Principat d''Andorra, y sus reglamentos de desarrollo.
- RGPD: Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, relativo a la protección de las personas físicas respecto al tratamiento de datos personales y a la libre circulación de estos datos.

## 3. Datos que Recopilamos y Finalidad

Tratamos los datos personales que nos facilitas a través de los formularios de contacto, reservas de tours y suscripciones informativas:

- Datos identificativos y de contacto: Nombre, apellidos, correo electrónico, teléfono y país de procedencia, utilizados para responder a tus consultas, coordinar actividades y gestionar reservas de experiencias guiadas.
- Datos de actividad y nivel técnico: Información sobre nivel físico, experiencia previa en montaña o requerimientos específicos para garantizar la máxima seguridad durante las rutas.
- Comunicaciones: Mensajes y comentarios remitidos para presupuestos de viajes a medida, paquetes multi-día o eventos de team building corporativo.

## 4. Base Jurídica y Conservación

La base legal para el tratamiento de tus datos es la ejecución de medidas precontractuales o contractuales al solicitar información o contratar una actividad, así como el consentimiento explícito otorgado al enviar formularios de consulta.

Los datos personales se conservarán durante el tiempo estrictamente necesario para cumplir con las finalidades para las que fueron recabados y mientras existan obligaciones legales aplicables en el Principat d''Andorra.

## 5. Derechos de los Usuarios

De acuerdo con la LQPD y el RGPD, puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición:

Para ejercer cualquiera de estos derechos, puedes enviar una solicitud escrita acompañada de una copia de tu documento de identidad a info@i-wildland.com o a nuestra dirección postal en Av. de Sant Antoni 12, AD400 La Massana, Andorra. Asimismo, tienes derecho a presentar una reclamación ante la Agencia Andorrana de Protección de Datos (APDA) si consideras vulnerados tus derechos.

## 6. Seguridad y Confidencialidad

iWE implementa las medidas técnicas y organizativas necesarias para garantizar la confidencialidad, integridad y disponibilidad de tus datos personales, evitando su alteración, pérdida o acceso no autorizado.', NOW())
ON DUPLICATE KEY UPDATE content_key = content_key;

INSERT INTO site_content (content_key, content_value, updated_at) VALUES
  ('privacy_policy_title', 'Política de Privacidad', NOW()),
  ('privacy_policy_eyebrow', 'Aviso Legal & Privacidad', NOW()),
  ('privacy_policy_seo_description', 'Información legal, protección de datos y condiciones de privacidad de Isard Wildland Experience (iWE).', NOW())
ON DUPLICATE KEY UPDATE content_key = content_key;
