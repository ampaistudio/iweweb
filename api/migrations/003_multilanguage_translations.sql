-- =============================================================================
-- iWE Dashboard - Migration 003: Multi-language Translations (ES, CA, EN, FR)
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: activity_translations
-- Multi-language titles and descriptions for activities (CA, EN, FR).
-- Spanish (ES) remains authoritative in the base 'activities' table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_act_trans_activity FOREIGN KEY (activity_id) 
    REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_activity_locale (activity_id, locale),
  INDEX idx_activity_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: activity_highlight_translations
-- Multi-language highlights for activities (CA, EN, FR).
-- Spanish (ES) remains in the base 'activity_highlights' table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_highlight_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  highlight_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  highlight_text VARCHAR(300) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hl_trans_highlight FOREIGN KEY (highlight_id) 
    REFERENCES activity_highlights(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_highlight_locale (highlight_id, locale),
  INDEX idx_highlight_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: site_content_translations
-- Multi-language institutional texts for site_content (CA, EN, FR).
-- Spanish (ES) remains in the base 'site_content' table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_key VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  content_value TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_trans_key FOREIGN KEY (content_key) 
    REFERENCES site_content(content_key) ON DELETE CASCADE,
  UNIQUE KEY uniq_content_locale (content_key, locale),
  INDEX idx_content_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: post_translations
-- Multi-language news/blog post titles and body content (CA, EN, FR).
-- Spanish (ES) remains in the base 'posts' table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_post_trans_post FOREIGN KEY (post_id) 
    REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_post_locale (post_id, locale),
  INDEX idx_post_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

