-- Optional detail content for the existing multi-day package catalogue.
-- Menu grouping continues to use menu_items (link_type = 'package').
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS package_content (
  package_id VARCHAR(80) NOT NULL PRIMARY KEY,
  intro_title VARCHAR(200) NULL,
  intro_text TEXT NULL,
  highlights_json TEXT NULL,
  itinerary_json TEXT NULL,
  CONSTRAINT fk_package_content_package FOREIGN KEY (package_id)
    REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS package_content_translations (
  package_id VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  intro_title VARCHAR(200) NULL,
  intro_text TEXT NULL,
  highlights_json TEXT NULL,
  itinerary_json TEXT NULL,
  PRIMARY KEY (package_id, locale),
  CONSTRAINT fk_package_content_translation_package FOREIGN KEY (package_id)
    REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS package_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id VARCHAR(80) NOT NULL,
  media_type ENUM('image', 'video') NOT NULL DEFAULT 'image',
  media_url VARCHAR(500) NOT NULL,
  poster_url VARCHAR(500) NULL,
  alt_text VARCHAR(300) NULL,
  display_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_package_media_package FOREIGN KEY (package_id)
    REFERENCES packages(id) ON DELETE CASCADE,
  INDEX idx_package_media_order (package_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
