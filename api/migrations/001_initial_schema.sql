-- =============================================================================
-- iWE Dashboard - Migration 001: Initial Schema
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: activities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  region VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  type VARCHAR(40) NOT NULL,
  level VARCHAR(80) NOT NULL,
  duration VARCHAR(80) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(300) NOT NULL,
  price VARCHAR(80) NULL,
  description TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activities_type (type),
  INDEX idx_activities_published (published),
  INDEX idx_activities_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: activity_highlights
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_highlights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(80) NOT NULL,
  highlight_text VARCHAR(300) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_highlights_activity FOREIGN KEY (activity_id) 
    REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_highlights_activity_order (activity_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: site_content
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  content_key VARCHAR(80) PRIMARY KEY,
  content_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: media
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  uploaded_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) 
    REFERENCES users(id),
  INDEX idx_media_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: posts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  cover_media_id INT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  origin ENUM('web','facebook','instagram') NOT NULL DEFAULT 'web',
  created_by INT NOT NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_cover_media FOREIGN KEY (cover_media_id) 
    REFERENCES media(id) ON DELETE SET NULL,
  CONSTRAINT fk_posts_author FOREIGN KEY (created_by) 
    REFERENCES users(id),
  INDEX idx_posts_status_published (status, published_at),
  INDEX idx_posts_origin (origin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: post_social_links
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  platform ENUM('facebook','instagram') NOT NULL,
  external_post_id VARCHAR(120) NOT NULL,
  external_permalink VARCHAR(500) NULL,
  sync_status ENUM('pending','synced','failed') NOT NULL DEFAULT 'pending',
  sync_error TEXT NULL,
  synced_at DATETIME NULL,
  CONSTRAINT fk_post_social_post FOREIGN KEY (post_id) 
    REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_platform_post (platform, external_post_id),
  INDEX idx_social_sync_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
