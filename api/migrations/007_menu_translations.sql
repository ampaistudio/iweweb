-- ==============================================================================
-- Migración 007: Carga de traducciones iniciales para el menú de navegación (CA/EN/FR)
-- Base de Datos: iwe_dashboard / iwe_dashboard_local
-- Fecha: 2026-09-17
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RATIONALE & CONTEXTO TÉCNICO:
-- La tabla `menu_items` contiene los 33 elementos del árbol de navegación con sus
-- etiquetas base en Español.
-- Esta migración puebla la tabla `menu_item_translations` para los 3 idiomas
-- adicionales soportados por la plataforma iWE (Català, English, Français),
-- respetando topónimos andorranos/pirenaicos y términos internacionales estándar.
-- ------------------------------------------------------------------------------

SET NAMES utf8mb4;

INSERT INTO menu_item_translations (menu_item_id, locale, label) VALUES
-- 1: Inicio
(1, 'ca', 'Inici'),
(1, 'en', 'Home'),
(1, 'fr', 'Accueil'),

-- 2: Sobre Nosotros
(2, 'ca', 'Sobre Nosaltres'),
(2, 'en', 'About Us'),
(2, 'fr', 'À Propos de Nous'),

-- 3: Política de Protección de Datos
(3, 'ca', 'Política de Protecció de Dades'),
(3, 'en', 'Privacy Policy'),
(3, 'fr', 'Politique de Confidentialité'),

-- 4: Andorra Holiday & Bike
(4, 'ca', 'Andorra Holiday & Bike'),
(4, 'en', 'Andorra Holiday & Bike'),
(4, 'fr', 'Andorra Holiday & Bike'),

-- 5: Andorra Holiday & Bike 8 Días / 7 Noches
(5, 'ca', 'Andorra Holiday & Bike 8 Dies / 7 Nits'),
(5, 'en', 'Andorra Holiday & Bike 8 Days / 7 Nights'),
(5, 'fr', 'Andorra Holiday & Bike 8 Jours / 7 Nuits'),

-- 6: Andorra Holiday & Bike 5 Días / 4 Noches
(6, 'ca', 'Andorra Holiday & Bike 5 Dies / 4 Nits'),
(6, 'en', 'Andorra Holiday & Bike 5 Days / 4 Nights'),
(6, 'fr', 'Andorra Holiday & Bike 5 Jours / 4 Nuits'),

-- 7: Experiencia Verano
(7, 'ca', 'Experiència Estiu'),
(7, 'en', 'Summer Experience'),
(7, 'fr', 'Expérience Été'),

-- 8: Heli Tour
(8, 'ca', 'Heli Tour'),
(8, 'en', 'Heli Tour'),
(8, 'fr', 'Heli Tour'),

-- 9: Rafting
(9, 'ca', 'Ràfting'),
(9, 'en', 'Rafting'),
(9, 'fr', 'Rafting'),

-- 10: Bike
(10, 'ca', 'Bike'),
(10, 'en', 'Bike'),
(10, 'fr', 'Bike'),

-- 11: E-Bike-Enduro Forn de Canillo
(11, 'ca', 'E-Bike-Enduro Forn de Canillo'),
(11, 'en', 'E-Bike-Enduro Forn de Canillo'),
(11, 'fr', 'E-Bike-Enduro Forn de Canillo'),

-- 12: Enduro en Llosada
(12, 'ca', 'Enduro a Llosada'),
(12, 'en', 'Enduro in Llosada'),
(12, 'fr', 'Enduro à Llosada'),

-- 13: E-Bike-Enduro-Arcalís All Mountain
(13, 'ca', 'E-Bike-Enduro-Arcalís All Mountain'),
(13, 'en', 'E-Bike-Enduro-Arcalís All Mountain'),
(13, 'fr', 'E-Bike-Enduro-Arcalís All Mountain'),

-- 14: Remontes-BTT-E-bike
(14, 'ca', 'Remuntadors-BTT-E-bike'),
(14, 'en', 'Bike Shuttle & Lifts'),
(14, 'fr', 'Remontées-VTT-E-bike'),

-- 15: 4x4
(15, 'ca', '4x4'),
(15, 'en', '4x4'),
(15, 'fr', '4x4'),

-- 16: Lagos Off Road
(16, 'ca', 'Llacs Off Road'),
(16, 'en', 'Lakes Off Road'),
(16, 'fr', 'Lacs Off Road'),

-- 17: Tor Off Road
(17, 'ca', 'Tor Off Road'),
(17, 'en', 'Tor Off Road'),
(17, 'fr', 'Tor Off Road'),

-- 18: Pic Negre Off Road
(18, 'ca', 'Pic Negre Off Road'),
(18, 'en', 'Pic Negre Off Road'),
(18, 'fr', 'Pic Negre Off Road'),

-- 19: Senderismo
(19, 'ca', 'Senderisme'),
(19, 'en', 'Hiking'),
(19, 'fr', 'Randonnée'),

-- 20: Senderismo Medio Día
(20, 'ca', 'Senderisme Mig Dia'),
(20, 'en', 'Half Day Hiking'),
(20, 'fr', 'Randonnée Demi-Journée'),

-- 21: Senderismo Día Entero
(21, 'ca', 'Senderisme Dia Sencer'),
(21, 'en', 'Full Day Hiking'),
(21, 'fr', 'Randonnée Journée Complète'),

-- 22: Vía Ferrata
(22, 'ca', 'Via Ferrada'),
(22, 'en', 'Via Ferrata'),
(22, 'fr', 'Via Ferrata'),

-- 23: Vía Ferrata Iniciación
(23, 'ca', 'Via Ferrada Iniciació'),
(23, 'en', 'Beginner Via Ferrata'),
(23, 'fr', 'Via Ferrata Initiation'),

-- 24: Vía Ferrata Avanzado
(24, 'ca', 'Via Ferrada Avançat'),
(24, 'en', 'Advanced Via Ferrata'),
(24, 'fr', 'Via Ferrata Perfectionnement'),

-- 25: Experiencia Invierno
(25, 'ca', 'Experiència Hivern'),
(25, 'en', 'Winter Experience'),
(25, 'fr', 'Expérience Hiver'),

-- 26: Caminata Raquetas Nocturna - 5hs
(26, 'ca', 'Caminada Raquetes Nocturna - 5hs'),
(26, 'en', 'Night Snowshoe Tour - 5h'),
(26, 'fr', 'Randonnée Raquettes Nocturne - 5h'),

-- 27: Esquí de Montaña
(27, 'ca', 'Esquí de Muntanya'),
(27, 'en', 'Ski Touring'),
(27, 'fr', 'Ski de Randonnée'),

-- 28: Viajes a Medida
(28, 'ca', 'Viatges a Mida'),
(28, 'en', 'Custom Trips'),
(28, 'fr', 'Voyages sur Mesure'),

-- 29: Grupos-Incentivos
(29, 'ca', 'Grups-Incentius'),
(29, 'en', 'Groups & Incentives'),
(29, 'fr', 'Groupes & Incentives'),

-- 30: Coaching Deportivo-Empresarial
(30, 'ca', 'Coaching Esportiu-Empresarial'),
(30, 'en', 'Sports & Corporate Coaching'),
(30, 'fr', 'Coaching Sportif & Entreprise'),

-- 31: Eventos Deportivos iWE
(31, 'ca', 'Esdeveniments Esportius iWE'),
(31, 'en', 'iWE Sports Events'),
(31, 'fr', 'Événements Sportifs iWE'),

-- 32: Novedades
(32, 'ca', 'Novetats'),
(32, 'en', 'News'),
(32, 'fr', 'Actualités'),

-- 33: Contáctenos
(33, 'ca', 'Contacteu-nos'),
(33, 'en', 'Contact Us'),
(33, 'fr', 'Contactez-nous')
ON DUPLICATE KEY UPDATE label = VALUES(label);

