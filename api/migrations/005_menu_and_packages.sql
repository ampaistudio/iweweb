-- =============================================================================
-- iWE Dashboard - Migration 005: Menu Hierarchy, Packages & Structured Prices
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: menu_items
-- Jerarquía padre/hijo, referencia opcional a una actividad o paquete existente.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  label VARCHAR(150) NOT NULL,                 -- texto en español (ES), autoritativo
  link_type ENUM('route','anchor','activity','package','external') NOT NULL,
  target_value VARCHAR(300) NOT NULL,          -- ej: "/novedades", "#tours", "esqui-dia" (activity_id), "andorra-holiday-8d" (package_id), "https://..."
  display_order INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,     -- override manual, igual patrón que activities/hero_slides
  publish_at DATETIME NULL,                    -- si se define, el item NO se muestra hasta esta fecha
  unpublish_at DATETIME NULL,                  -- si se define, el item deja de mostrarse desde esta fecha
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_parent FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_menu_parent (parent_id),
  INDEX idx_menu_order (display_order),
  INDEX idx_menu_published (published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: menu_item_translations
-- Traducciones de etiquetas de menú (ES, CA, EN, FR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_item_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  label VARCHAR(150) NOT NULL,
  CONSTRAINT fk_menu_trans_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_menu_locale (menu_item_id, locale),
  INDEX idx_menu_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: packages
-- Paquetes multi-día tipo "Andorra Holiday & Bike", separados de activities.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  duration VARCHAR(80) NOT NULL,               -- ej: "8 días / 7 noches"
  description TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  alt_text VARCHAR(300) NULL,
  price_amount DECIMAL(10,2) NULL,
  price_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  price_unit VARCHAR(80) NULL,                 -- ej: "por persona" — ESTE campo sí se traduce
  display_order INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,
  publish_at DATETIME NULL,
  unpublish_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_packages_published (published),
  INDEX idx_packages_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: package_translations
-- Traducciones para packages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS package_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price_unit VARCHAR(80) NULL,
  CONSTRAINT fk_pkg_trans_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_package_locale (package_id, locale),
  INDEX idx_package_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Schema Alterations: Structured Prices on activities & activity_translations
-- -----------------------------------------------------------------------------
-- Verificar/Agregar columnas de precio estructurado
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'price_amount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE activities ADD COLUMN price_amount DECIMAL(10,2) NULL AFTER price, ADD COLUMN price_currency VARCHAR(3) NOT NULL DEFAULT \'EUR\' AFTER price_amount, ADD COLUMN price_unit VARCHAR(80) NULL AFTER price_currency;', 'SELECT 1;');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_trans_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_translations' AND COLUMN_NAME = 'price_unit');
SET @sql_trans = IF(@col_trans_exists = 0, 'ALTER TABLE activity_translations ADD COLUMN price_unit VARCHAR(80) NULL AFTER description;', 'SELECT 1;');
PREPARE stmt_trans FROM @sql_trans; EXECUTE stmt_trans; DEALLOCATE PREPARE stmt_trans;

-- Migración de datos existentes de price a price_amount, price_currency, price_unit:
-- 100% de las filas existentes en `activities` fueron parseadas exitosamente:
-- - '€80 por persona' -> amount: 80.00, currency: 'EUR', unit: 'por persona' (4x4-tor, via-ferrata-iniciacion)
-- - '€85 por persona' -> amount: 85.00, currency: 'EUR', unit: 'por persona' (pic-negre, via-ferrata-avanzado, senderismo-jucla, rafting-noguera)
-- - NULL -> amount: NULL, currency: 'EUR', unit: NULL (esqui-dia, esqui-montana, raquetas-nieve, ebike-forn-canillo, ebike-llosada, ebike-arcalis, remontes-btt, lagos-off-road, senderismo-incles, heliflight)
UPDATE activities
SET 
  price_amount = CASE 
    WHEN price LIKE '%80%' THEN 80.00
    WHEN price LIKE '%85%' THEN 85.00
    ELSE NULL
  END,
  price_currency = 'EUR',
  price_unit = CASE 
    WHEN price LIKE '%por persona%' THEN 'por persona'
    ELSE NULL
  END;

-- Actualizar duración confirmada de raquetas-nieve a '5 horas'
UPDATE activities 
SET duration = '5 horas' 
WHERE id = 'raquetas-nieve';

-- Traducción de price_unit en activity_translations
UPDATE activity_translations
SET price_unit = CASE locale
    WHEN 'ca' THEN 'per persona'
    WHEN 'en' THEN 'per person'
    WHEN 'fr' THEN 'par personne'
    ELSE 'por persona'
  END
WHERE activity_id IN ('4x4-tor', 'pic-negre', 'via-ferrata-iniciacion', 'via-ferrata-avanzado', 'senderismo-jucla', 'rafting-noguera');

-- -----------------------------------------------------------------------------
-- 6. Seeds: Packages
-- -----------------------------------------------------------------------------
INSERT INTO packages (id, title, duration, description, image_url, alt_text, price_amount, price_currency, price_unit, display_order, published, publish_at, unpublish_at, created_at, updated_at)
VALUES
  (
    'andorra-holiday-8d',
    'Andorra Holiday & Bike 8 Días / 7 Noches',
    '8 días / 7 noches',
    'Semana mágica e inolvidable de puro enduro en el corazón de los Pirineos andorranos. Incluye habitación en hotel base doble, guía profesional permanente y traslados ida y vuelta al aeropuerto.',
    'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/DSC09590-605x605.jpg',
    'Andorra Holiday and Bike 8 Días / 7 Noches de Puro Enduro',
    639.00,
    'EUR',
    'por persona',
    1,
    1,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'andorra-holiday-5d',
    'Andorra Holiday & Bike 5 Días / 4 Noches',
    '5 días / 4 noches',
    'Escapada de puro enduro de 5 días y 4 noches en los senderos más espectaculares de Andorra. Incluye habitación en hotel base doble, guía permanente y traslados ida y vuelta al aeropuerto.',
    'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg',
    'Andorra Holiday and Bike 5 Días / 4 Noches de Puro Enduro',
    495.00,
    'EUR',
    'por persona',
    2,
    1,
    NULL,
    NULL,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  duration = VALUES(duration),
  description = VALUES(description),
  price_amount = VALUES(price_amount),
  price_currency = VALUES(price_currency),
  price_unit = VALUES(price_unit),
  display_order = VALUES(display_order),
  published = VALUES(published);

-- Traducciones iniciales para packages
INSERT INTO package_translations (package_id, locale, title, description, price_unit)
VALUES
  ('andorra-holiday-8d', 'ca', 'Andorra Holiday & Bike 8 Dies / 7 Nits', 'Setmana màgica i inoblidable de pur enduro al cor dels Pirineus andorrans. Inclou habitació d''hotel base doble, guia professional permanent i trasllats anada i tornada a l''aeroport.', 'per persona'),
  ('andorra-holiday-8d', 'en', 'Andorra Holiday & Bike 8 Days / 7 Nights', 'A magical and unforgettable week of pure enduro riding in the heart of the Pyrenees. Includes double-occupancy hotel accommodation, full-time certified guide, and roundtrip airport transfers.', 'per person'),
  ('andorra-holiday-8d', 'fr', 'Andorra Holiday & Bike 8 Jours / 7 Nuits', 'Une semaine magique et inoubliable de pur enduro au cœur des Pyrénées andorranes. Comprend hébergement en hôtel base double, guide professionnel permanent et transferts aéroport aller-retour.', 'par personne'),
  ('andorra-holiday-5d', 'ca', 'Andorra Holiday & Bike 5 Dies / 4 Nits', 'Escapada de pur enduro de 5 dies i 4 nits pels senders més espectaculars d''Andorra. Inclou habitació d''hotel base doble, guia permanent i trasllats anada i tornada a l''aeroport.', 'per persona'),
  ('andorra-holiday-5d', 'en', 'Andorra Holiday & Bike 5 Days / 4 Nights', 'Pure enduro 5-day / 4-night getaway on Andorra''s most scenic singletracks. Includes double-occupancy hotel accommodation, full-time guide, and roundtrip airport transfers.', 'per person'),
  ('andorra-holiday-5d', 'fr', 'Andorra Holiday & Bike 5 Jours / 4 Nuits', 'Escapade pur enduro de 5 jours et 4 nuits sur les plus beaux sentiers d''Andorre. Comprend hébergement en hôtel base double, guide permanent et transferts aéroport aller-retour.', 'par personne')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  price_unit = VALUES(price_unit);

-- -----------------------------------------------------------------------------
-- 7. Seeds: Menu Items Hierarchy (1:1 con WordPress WP-Admin)
-- -----------------------------------------------------------------------------
DELETE FROM menu_items;

-- Root Items
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (1,  NULL, 'Inicio',                      'route',  '/',                    1, 1, NULL, NULL),
  (2,  NULL, 'Sobre Nosotros',              'anchor', '/#mission',            2, 1, NULL, NULL),
  (4,  NULL, 'Andorra Holiday & Bike',       'anchor', '/#holiday',            3, 0, NULL, NULL), -- published=0 por defecto hasta que Christian defina publish_at
  (7,  NULL, 'Experiencia Verano',           'anchor', '/#tours',              4, 1, NULL, NULL),
  (25, NULL, 'Experiencia Invierno',         'anchor', '/#esqui-snow',         5, 1, NULL, NULL),
  (28, NULL, 'Viajes a Medida',              'anchor', '/#viajes-medida',      6, 1, NULL, NULL),
  (31, NULL, 'Eventos Deportivos iWE',       'anchor', '/#eventos-deportivos', 7, 1, NULL, NULL),
  (32, NULL, 'Novedades',                    'route',  '/novedades',           8, 1, NULL, NULL),
  (33, NULL, 'Contáctenos',                  'anchor', '/#contact',            9, 1, NULL, NULL);

-- Subitems de Sobre Nosotros (id: 2)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (3, 2, 'Política de Protección de Datos', 'route', '/privacidad', 1, 1, NULL, NULL);

-- Subitems de Andorra Holiday & Bike (id: 4)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (5, 4, 'Andorra Holiday & Bike 8 Días / 7 Noches', 'package', 'andorra-holiday-8d', 1, 1, NULL, NULL),
  (6, 4, 'Andorra Holiday & Bike 5 Días / 4 Noches', 'package', 'andorra-holiday-5d', 2, 1, NULL, NULL);

-- Subitems de Experiencia Verano (id: 7)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (8,  7, 'Heli Tour',    'activity', 'heliflight',       1, 1, NULL, NULL),
  (9,  7, 'Rafting',      'activity', 'rafting-noguera',  2, 1, NULL, NULL),
  (10, 7, 'Bike',         'anchor',   '/#bike',           3, 1, NULL, NULL),
  (15, 7, '4x4',          'anchor',   '/#4x4',            4, 1, NULL, NULL),
  (19, 7, 'Senderismo',   'anchor',   '/#senderismo',     5, 1, NULL, NULL),
  (22, 7, 'Vía Ferrata',  'anchor',   '/#via-ferrata',    6, 1, NULL, NULL);

-- Subitems de Bike (id: 10)
-- NOTA: Las 5 actividades pendientes (Roc del Forn, Maia-Ciscaró, Bike Park, Beixalís, Pirineos) NO se incluyen en este seed según Sección 4.
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (11, 10, 'E-Bike-Enduro Forn de Canillo',      'activity', 'ebike-forn-canillo', 1, 1, NULL, NULL),
  (12, 10, 'Enduro en Llosada',                  'activity', 'ebike-llosada',      2, 1, NULL, NULL),
  (13, 10, 'E-Bike-Enduro-Arcalís All Mountain', 'activity', 'ebike-arcalis',      3, 1, NULL, NULL),
  (14, 10, 'Remontes-BTT-E-bike',                'activity', 'remontes-btt',       4, 1, NULL, NULL);

-- Subitems de 4x4 (id: 15)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (16, 15, 'Lagos Off Road',     'activity', 'lagos-off-road', 1, 1, NULL, NULL),
  (17, 15, 'Tor Off Road',       'activity', '4x4-tor',        2, 1, NULL, NULL),
  (18, 15, 'Pic Negre Off Road', 'activity', 'pic-negre',      3, 1, NULL, NULL);

-- Subitems de Senderismo (id: 19)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (20, 19, 'Senderismo Medio Día',  'activity', 'senderismo-incles', 1, 1, NULL, NULL),
  (21, 19, 'Senderismo Día Entero', 'activity', 'senderismo-jucla',  2, 1, NULL, NULL);

-- Subitems de Vía Ferrata (id: 22)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (23, 22, 'Vía Ferrata Iniciación', 'activity', 'via-ferrata-iniciacion', 1, 1, NULL, NULL),
  (24, 22, 'Vía Ferrata Avanzado',   'activity', 'via-ferrata-avanzado',   2, 1, NULL, NULL);

-- Subitems de Experiencia Invierno (id: 25)
-- NOTA: "Caminata Raquetas Diurna - 4hs" y "Esquí Tour" quedan fuera como pendientes según Sección 4.
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (26, 25, 'Caminata Raquetas Nocturna - 5hs', 'activity', 'raquetas-nieve', 1, 1, NULL, NULL),
  (27, 25, 'Esquí de Montaña',                 'activity', 'esqui-montana',  2, 1, NULL, NULL);

-- Subitems de Viajes a Medida (id: 28)
INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
VALUES
  (29, 28, 'Grupos-Incentivos',              'anchor', '/#viajes-medida', 1, 1, NULL, NULL),
  (30, 28, 'Coaching Deportivo-Empresarial', 'anchor', '/#viajes-medida', 2, 1, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;

