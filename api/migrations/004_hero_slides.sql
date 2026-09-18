-- =============================================================================
-- iWE Dashboard - Migration 004: Hero Slides Management
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: hero_slides
-- Stores dynamic slides (images or videos) for the public homepage hero banner.
-- Supports direct server uploads and external streaming/CDN URLs.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slide_type ENUM('image', 'video') NOT NULL DEFAULT 'image',
  media_source ENUM('upload', 'external_url') NOT NULL DEFAULT 'external_url',
  src VARCHAR(500) NOT NULL,
  poster VARCHAR(500) NULL,
  alt VARCHAR(300) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hero_slides_published (published),
  INDEX idx_hero_slides_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Seed Initial Slides (Preserving the 3 original Home.tsx slides)
-- -----------------------------------------------------------------------------
INSERT INTO hero_slides (id, slide_type, media_source, src, poster, alt, display_order, published, created_at, updated_at)
VALUES
  (
    1,
    'image',
    'external_url',
    'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg',
    NULL,
    'Guía de montaña de iWE en los Pirineos de Andorra',
    1,
    1,
    NOW(),
    NOW()
  ),
  (
    2,
    'image',
    'external_url',
    'https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg',
    NULL,
    'E-Bike Enduro en Forn de Canillo',
    2,
    1,
    NOW(),
    NOW()
  ),
  (
    3,
    'image',
    'external_url',
    'https://i-wildland.com/wp-content/uploads/2020/05/IMG_20180724_171459-800x533.jpg',
    NULL,
    'Excursión 4x4 en la ruta de los contrabandistas hacia Tor',
    3,
    1,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  src = VALUES(src),
  alt = VALUES(alt);

SET FOREIGN_KEY_CHECKS = 1;

