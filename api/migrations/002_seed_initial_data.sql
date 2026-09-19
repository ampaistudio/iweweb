-- =============================================================================
-- iWE Dashboard - Migration 002: Seed Initial Data
-- Seeds initial administrators, site_content key/values, and all 16 activities
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- 1. Initial Users (Christian & Charly)
-- Contraseña temporal aleatoria de un solo uso. Cambiarla inmediatamente
-- despues de correr esta migracion en cualquier entorno nuevo.
-- -----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, display_name, created_at)
VALUES
  (1, 'christian@nodoai.com', '$2y$12$1fRgMDP4EsD5TJGHOwT4v.Mmx1lX7pw.4CWtqjpMp2Hp9b21NwhYm', 'Christian Rotger', NOW()),
  (2, 'charly@isardwildland.com', '$2y$12$1fRgMDP4EsD5TJGHOwT4v.Mmx1lX7pw.4CWtqjpMp2Hp9b21NwhYm', 'Charly Paredes', NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- -----------------------------------------------------------------------------
-- 2. Initial Site Content (Key / Value institutional texts)
-- -----------------------------------------------------------------------------
INSERT INTO site_content (content_key, content_value)
VALUES
  ('business_name', 'Isard Wildland Experience'),
  ('hero_tagline', 'Fabricamos experiencias.'),
  ('mission_eyebrow', 'Nuestra empresa'),
  ('mission_title', 'Líderes en turismo de experiencias en Andorra y los Pirineos.'),
  ('mission_text', 'Descubre un mundo de experiencias únicas con un solo operador turístico. Esquí, snowboard, raquetas de nieve, tours culturales y todo lo que te puedas imaginar para vivir la montaña, guiado por expertos locales como Charly Paredes.'),
  ('team_eyebrow', 'Nuestro equipo'),
  ('team_title', 'Fundada en 2018. Guiada por expertos locales.'),
  ('team_bio', 'iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2 (EFPEM Andorra), instructor de esquí certificado por AADIDES/ISIA y miembro de UIMLA y AGAMA. Formado entre Ushuaia y Andorra, habla catalán, español, francés e inglés. Cada ruta está pensada para adaptarse a tu nivel físico y técnico, sea que viajes en familia, en pareja o con amigos. Tú pones la curiosidad. Nosotros nos ocupamos del resto.'),
  ('contact_phone', '+376 344 870'),
  ('contact_email', 'info@i-wildland.com'),
  ('contact_address', 'AD100 Canillo, Principat d\'Andorra')
ON DUPLICATE KEY UPDATE content_value = VALUES(content_value);

-- -----------------------------------------------------------------------------
-- 3. Initial Activities
-- -----------------------------------------------------------------------------
INSERT INTO activities (id, title, region, country, type, level, duration, image_url, alt_text, price, description, display_order, published)
VALUES
  ('esqui-dia', 'Experiencia día de Esquí', 'Grandvalira / Vallnord', 'Andorra', 'Esquí-Snow', 'Todos los niveles', '6 horas', 'https://i-wildland.com/wp-content/uploads/2019/11/Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences.jpg', 'Experiencia de esquí en Andorra', NULL, 'Una jornada completa de esquí en las mejores pistas de Andorra, guiada por instructores certificados que adaptan el recorrido a tu nivel. Ideal para descubrir Grandvalira o Vallnord con acompañamiento local.', 1, 1),
  ('esqui-montana', 'Esquí de Montaña', 'Andorra', 'Andorra', 'Esquí-Snow', 'Intermedio +', '6 horas', 'https://i-wildland.com/wp-content/uploads/2019/11/Raquetes-de-Neu-Andorra-Andorra-Turismo-Pyrynees-experiences.jpg', 'Esquí de montaña en los Pirineos de Andorra', NULL, 'Sal de las pistas balizadas y descubre el esquí de montaña en los Pirineos andorranos: ascensos con pieles de foca y descensos en nieve virgen, siempre con seguridad y conocimiento del terreno.', 2, 1),
  ('raquetas-nieve', 'Caminata con Raquetas de Nieve Nocturna', 'Andorra', 'Andorra', 'Esquí-Snow', 'Principiante +', '4-5 horas', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/cropped-Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences-605x605.jpg', 'Caminata nocturna con raquetas de nieve en Andorra', NULL, 'Una experiencia distinta: caminar sobre la nieve de noche, con raquetas, bajo el cielo estrellado de los Pirineos. Disponible también en versión diurna de 4 horas.', 3, 1),
  ('ebike-forn-canillo', 'E-Bike Enduro en Forn de Canillo', 'Canillo', 'Andorra', 'BTT', 'Intermedio +', '6 horas', 'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg', 'E-Bike Enduro en Forn de Canillo, La Cova, 72 curvas', NULL, 'Enduro en e-bike por el Forn de Canillo, La Cova y las famosas 72 curvas. Alta intensidad física, con e-bikes disponibles para alquilar si no traés la tuya.', 4, 1),
  ('ebike-llosada', 'E-Bike Enduro en LLosada', 'Encamp', 'Andorra', 'BTT', 'Intermedio +', 'Día completo', 'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/DSC09590-605x605.jpg', 'E-Bike Enduro en LLosada, Intermedia Funi, Encamp', NULL, 'Ruta de enduro en e-bike combinando el funicular con senderos técnicos en LLosada, Encamp. Vistas panorámicas durante el ascenso y descenso con flow por bosque y cresta de montaña.', 5, 1),
  ('ebike-arcalis', 'E-Bike Enduro Arcalis All Mountain', 'Arcalís', 'Andorra', 'BTT', 'Todos los niveles / Familia', 'Día completo', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Arcalis-iWE-1-605x605.jpg', 'E-Bike Arcalis All Mountain en familia', NULL, 'Ruta All Mountain en e-bike apta para toda la familia, pedaleando junto al río en el entorno de Arcalís. Pensada para compartir la experiencia del enduro con niños.', 6, 1),
  ('remontes-btt', 'Remontes BTT-Enduro', 'Andorra', 'Andorra', 'BTT', 'Intermedio +', 'Día completo', 'https://i-wildland.com/wp-content/uploads/2020/04/portella-del-forn-canillo-800x533.jpg', 'Remontes BTT Enduro, rutas únicas en Andorra', NULL, 'Aprovechá los remontes de Andorra para maximizar el tiempo de descenso en bici: subís en telesilla y bajás por rutas de enduro diseñadas por guías locales.', 7, 1),
  ('4x4-tor', 'Excursión 4x4 a Tor', 'Tor', 'España', '4x4', 'Todos los niveles', '4 horas', 'https://i-wildland.com/wp-content/uploads/2020/05/IMG_20180724_171459-800x533.jpg', 'Excursión en 4x4 hacia el paraje de Tor', '€80 por persona', 'Excursión de 4 horas en Land Rover Defender por la histórica ruta de los contrabandistas hasta Tor, un pequeño pueblo español de acceso solo practicable en 4x4. Paisajes de alta montaña y parada en el único bar del pueblo.', 8, 1),
  ('lagos-off-road', 'Lagos Off-Road', 'Pirineos', 'Andorra', '4x4', 'Todos los niveles', '4 horas', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4-x-4-Lagos-Off-Road-605x605.jpg', 'Excursión 4x4 a los lagos de alta montaña', NULL, 'Excursión en 4x4 hacia los lagos de alta montaña de los Pirineos andorranos, con paradas para observar flora, fauna y los paisajes glaciares típicos de la zona.', 9, 1),
  ('pic-negre', 'Pic Negre Off Road', 'Claror', 'Andorra', '4x4', 'Todos los niveles', '4 horas', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Claror-verano-605x605.jpg', 'Excursión 4x4 Pic Negre Off Road', '€85 por persona', 'Aventura en Land Rover Defender para descubrir la belleza natural de la zona de Claror y el Pic Negre, con la misma ruta histórica de los contrabandistas como hilo conductor.', 10, 1),
  ('via-ferrata-iniciacion', 'Vía Ferrata Iniciación', 'Andorra', 'Andorra', 'Vía Ferrata', 'Principiante', 'Medio día', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4-605x605.png', 'Vía ferrata para principiantes en Andorra', '€80 por persona', 'Tu primera vía ferrata: una experiencia única pensada para quienes se quieren iniciar en esta actividad, con equipo de seguridad completo y acompañamiento constante del guía.', 11, 1),
  ('via-ferrata-avanzado', 'Vía Ferrata Avanzado', 'Andorra', 'Andorra', 'Vía Ferrata', 'Avanzado', 'Día completo', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/via-ferrata-3-150x150.jpg', 'Vía ferrata avanzada en Andorra', '€85 por persona', 'Para quienes ya tienen experiencia: tramos más expuestos y técnicos, con mayor exigencia física, en un entorno de alta montaña con vistas espectaculares.', 12, 1),
  ('senderismo-incles', 'Senderismo en Incles', 'Vall d''Incles', 'Andorra', 'Senderismo', 'Principiante +', 'Medio día', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/INCLES-605x605.jpg', 'Senderismo de verano en Vall d''Incles', NULL, 'Recorré la Vall d''Incles a pie, uno de los valles más fotogénicos de Andorra, con bosques de pino y haya, praderas alpinas y posibilidad de avistar marmotas, águilas y rebecos.', 13, 1),
  ('senderismo-jucla', 'Senderismo en Jucla', 'Jucla', 'Andorra', 'Senderismo', 'Principiante +', 'Día completo', 'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/JUCLA-605x605.jpg', 'Senderismo en Jucla, Andorra', '€85 por persona', 'Excursión de día completo para toda la familia por la zona de Jucla, combinando naturaleza y patrimonio cultural de los pueblos de montaña andorranos.', 14, 1),
  ('rafting-noguera', 'Rafting en Noguera Pallaresa', 'Noguera Pallaresa', 'España', 'Rafting', 'Principiante +', 'Medio día', 'https://i-wildland.com/wp-content/uploads/2020/04/noguera-pallaresa-4-scaled.jpg', 'Rafting en el río Noguera Pallaresa', '€85 por persona', 'Bajada en rafting por uno de los ríos más emblemáticos del Pirineo, el Noguera Pallaresa. Una experiencia para toda la familia con instructores certificados en aguas bravas.', 15, 1),
  ('heliflight', 'Heliflight', 'Andorra', 'Andorra', 'Heliflight', 'Todos los niveles', 'Variable', 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg', 'Experiencia de vuelo en helicóptero sobre Andorra', NULL, 'Sobrevolá los Pirineos andorranos en helicóptero para una perspectiva única de los valles, picos y lagos de montaña. Ideal para combinar con otra actividad terrestre.', 16, 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  region = VALUES(region),
  country = VALUES(country),
  type = VALUES(type),
  level = VALUES(level),
  duration = VALUES(duration),
  image_url = VALUES(image_url),
  alt_text = VALUES(alt_text),
  price = VALUES(price),
  description = VALUES(description),
  display_order = VALUES(display_order),
  published = VALUES(published);

-- -----------------------------------------------------------------------------
-- 4. Initial Activity Highlights
-- -----------------------------------------------------------------------------
DELETE FROM activity_highlights;

INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
VALUES
  -- esqui-dia
  ('esqui-dia', 'Guía certificado por AADIDES/ISIA', 1),
  ('esqui-dia', 'Adaptado a todos los niveles', 2),
  ('esqui-dia', 'Acceso a las mejores pistas de la temporada', 3),

  -- esqui-montana
  ('esqui-montana', 'Material técnico recomendado por el guía', 1),
  ('esqui-montana', 'Rutas fuera de pista seleccionadas según condiciones del día', 2),
  ('esqui-montana', 'Grupos reducidos', 3),

  -- raquetas-nieve
  ('raquetas-nieve', 'Raquetas y frontales incluidos', 1),
  ('raquetas-nieve', 'Apto para toda la familia', 2),
  ('raquetas-nieve', 'Versión diurna disponible (4hs) o nocturna (5hs)', 3),

  -- ebike-forn-canillo
  ('ebike-forn-canillo', 'Uplift: 750m / Climb: 450m', 1),
  ('ebike-forn-canillo', 'Descenso: 20km / -1150m', 2),
  ('ebike-forn-canillo', 'Grupos de 3 a 8 personas', 3),
  ('ebike-forn-canillo', 'E-bike disponible para alquilar', 4),

  -- ebike-llosada
  ('ebike-llosada', 'Combinación funicular + e-bike', 1),
  ('ebike-llosada', 'Descensos técnicos y de flow', 2),
  ('ebike-llosada', 'Zona: Intermedia Funi, Encamp', 3),

  -- ebike-arcalis
  ('ebike-arcalis', 'Apta para familias con niños', 1),
  ('ebike-arcalis', 'Recorrido junto al río', 2),
  ('ebike-arcalis', 'Nivel adaptable según el grupo', 3),

  -- remontes-btt
  ('remontes-btt', 'Uso de remontes para ahorrar esfuerzo', 1),
  ('remontes-btt', 'Rutas exclusivas diseñadas por guías profesionales', 2),
  ('remontes-btt', 'Ideal para aprovechar más descensos en menos tiempo', 3),

  -- 4x4-tor
  ('4x4-tor', 'Ruta histórica de los contrabandistas', 1),
  ('4x4-tor', 'Land Rover Defender con guía-conductor', 2),
  ('4x4-tor', 'Parada en el pueblo de Tor', 3),

  -- lagos-off-road
  ('lagos-off-road', 'Acceso a lagos de alta montaña', 1),
  ('lagos-off-road', 'Apto para grupos, familias y viajes de amigos', 2),
  ('lagos-off-road', 'Guía con conocimiento de la fauna y flora local', 3),

  -- pic-negre
  ('pic-negre', 'Land Rover Defender', 1),
  ('pic-negre', 'Ruta de los contrabandistas', 2),
  ('pic-negre', '4 horas de recorrido off-road', 3),

  -- via-ferrata-iniciacion
  ('via-ferrata-iniciacion', 'Ideal como primera experiencia en vía ferrata', 1),
  ('via-ferrata-iniciacion', 'Equipo de seguridad incluido', 2),
  ('via-ferrata-iniciacion', 'Guía certificado en vía ferrata', 3),

  -- via-ferrata-avanzado
  ('via-ferrata-avanzado', 'Tramos técnicos de mayor exposición', 1),
  ('via-ferrata-avanzado', 'Recomendado con experiencia previa en vía ferrata', 2),
  ('via-ferrata-avanzado', 'Equipo de seguridad incluido', 3),

  -- senderismo-incles
  ('senderismo-incles', 'Paisaje de bosques y praderas alpinas', 1),
  ('senderismo-incles', 'Posibilidad de avistar fauna de montaña', 2),
  ('senderismo-incles', 'Apto para familias', 3),

  -- senderismo-jucla
  ('senderismo-jucla', 'Recorrido de día completo', 1),
  ('senderismo-jucla', 'Incluye paso por pueblos con tradiciones ancestrales', 2),
  ('senderismo-jucla', 'Apto para toda la familia', 3),

  -- rafting-noguera
  ('rafting-noguera', 'Apto para toda la familia', 1),
  ('rafting-noguera', 'Equipo de seguridad incluido', 2),
  ('rafting-noguera', 'Instructores certificados en aguas bravas', 3),

  -- heliflight
  ('heliflight', 'Vistas panorámicas de Andorra desde el aire', 1),
  ('heliflight', 'Combinable con otras experiencias de iWE', 2),
  ('heliflight', 'Duración y ruta a medida', 3);
