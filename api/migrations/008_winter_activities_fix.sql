-- ==============================================================================
-- Migración 008: Corrección y completitud de "Experiencia Invierno"
-- Base de Datos: iwe_dashboard / iwe_dashboard_local
-- Fecha: 2026-09-17
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RATIONALE & CONTEXTO TÉCNICO:
-- 1. Renombrar actividad existente `esqui-dia` a "Esquí Tour" para coincidir con
--    la taxonomía del WordPress original.
-- 2. Insertar nueva actividad `raquetas-nieve-diurna` (4 horas) con su ficha
--    completa y highlights respectivos.
-- 3. Actualizar `raquetas-nieve` (nocturna, 5 horas) asegurando coherencia cruzada.
-- 4. Reordenar y completar los 4 hijos de `menu_items` bajo "Experiencia Invierno" (id=25):
--    - 1) Caminata Raquetas Diurna - 4hs (id=34, target=raquetas-nieve-diurna)
--    - 2) Caminata Raquetas Nocturna - 5hs (id=26, target=raquetas-nieve)
--    - 3) Esquí Tour (id=35, target=esqui-dia)
--    - 4) Esquí de Montaña (id=27, target=esqui-montana)
-- 5. Cargar traducciones (CA, EN, FR) para los nuevos ítems de menú (id=34 e id=35).
-- ------------------------------------------------------------------------------

SET NAMES utf8mb4;

-- 1. Actualizar actividad `esqui-dia`
UPDATE activities 
SET title = 'Esquí Tour', updated_at = NOW() 
WHERE id = 'esqui-dia';

-- 2. Insertar nueva actividad `raquetas-nieve-diurna`
INSERT INTO activities (
    id, title, region, country, type, level, duration, image_url, alt_text, description, display_order, published, created_at, updated_at
) VALUES (
    'raquetas-nieve-diurna',
    'Caminata con Raquetas de Nieve Diurna',
    'Andorra',
    'Andorra',
    'Esquí-Snow',
    'Principiante +',
    '4 horas',
    'https://privateyachtexpeditions.com/wp-content/uploads/2023/10/cropped-Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences-605x605.jpg',
    'Caminata diurna con raquetas de nieve en Andorra',
    'Una experiencia distinta: caminar sobre la nieve de día, con raquetas, disfrutando de las vistas de los Pirineos andorranos. Disponible también en versión nocturna de 5 horas.',
    17,
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    duration = VALUES(duration),
    description = VALUES(description),
    updated_at = NOW();

-- Highlights para `raquetas-nieve-diurna`
DELETE FROM activity_highlights WHERE activity_id = 'raquetas-nieve-diurna';
INSERT INTO activity_highlights (activity_id, highlight_text, display_order) VALUES
('raquetas-nieve-diurna', 'Raquetas y bastones incluidos', 1),
('raquetas-nieve-diurna', 'Apto para toda la familia', 2),
('raquetas-nieve-diurna', 'Versión nocturna disponible (5hs)', 3);

-- Ajuste de highlights en `raquetas-nieve` (nocturna) para consistencia cruzada
UPDATE activity_highlights
SET highlight_text = 'Versión diurna disponible (4hs)'
WHERE activity_id = 'raquetas-nieve' AND highlight_text LIKE 'Versión diurna disponible%';

-- 3. Reordenar ítems de menú existentes bajo `Experiencia Invierno` (id=25)
UPDATE menu_items SET display_order = 2, updated_at = NOW() WHERE id = 26;
UPDATE menu_items SET display_order = 4, updated_at = NOW() WHERE id = 27;

-- 4. Insertar nuevos ítems de menú para Raquetas Diurna y Esquí Tour
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at, created_at, updated_at)
VALUES
  (34, 25, 'Caminata Raquetas Diurna - 4hs', 'activity', 'raquetas-nieve-diurna', 1, 1, NULL, NULL, NOW(), NOW()),
  (35, 25, 'Esquí Tour', 'activity', 'esqui-dia', 3, 1, NULL, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  label = VALUES(label),
  link_type = VALUES(link_type),
  target_value = VALUES(target_value),
  display_order = VALUES(display_order),
  published = VALUES(published),
  updated_at = NOW();

-- 5. Traducciones para los 2 nuevos ítems de menú (CA, EN, FR)
DELETE FROM menu_item_translations WHERE menu_item_id IN (34, 35);

INSERT INTO menu_item_translations (menu_item_id, locale, label) VALUES
-- 34: Caminata Raquetas Diurna - 4hs
(34, 'ca', 'Caminada Raquetes Diürna - 4hs'),
(34, 'en', 'Day Snowshoe Tour - 4h'),
(34, 'fr', 'Randonnée Raquettes Diurne - 4h'),

-- 35: Esquí Tour
(35, 'ca', 'Esquí Tour'),
(35, 'en', 'Ski Tour'),
(35, 'fr', 'Ski Tour');

