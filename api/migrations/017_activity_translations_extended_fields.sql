-- =============================================================================
-- Migration 017: Extended Activity Translations (region, duration, level, country, alt_text)
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Extend activity_translations with regional, technical, and alt text fields
ALTER TABLE activity_translations
  ADD COLUMN region VARCHAR(120) NULL AFTER intro_text,
  ADD COLUMN country VARCHAR(120) NULL AFTER region,
  ADD COLUMN level VARCHAR(80) NULL AFTER country,
  ADD COLUMN duration VARCHAR(120) NULL AFTER level,
  ADD COLUMN alt_text VARCHAR(300) NULL AFTER duration;

-- 2. Create activity_image_translations table for gallery images multi-language alt text
CREATE TABLE IF NOT EXISTS activity_image_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_image_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  alt_text VARCHAR(300) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_img_trans_image FOREIGN KEY (activity_image_id) 
    REFERENCES activity_images(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_image_locale (activity_image_id, locale),
  INDEX idx_image_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
