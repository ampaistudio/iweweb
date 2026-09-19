-- Migration: 015_activity_social_links.sql
-- Adds social auto-sharing links table for activities (Facebook, Instagram)

CREATE TABLE IF NOT EXISTS activity_social_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id VARCHAR(100) NOT NULL,
    platform ENUM('facebook', 'instagram') NOT NULL,
    external_post_id VARCHAR(120) NOT NULL,
    external_permalink VARCHAR(500) NULL,
    sync_status ENUM('pending', 'synced', 'failed') NOT NULL DEFAULT 'pending',
    sync_error TEXT NULL,
    synced_at DATETIME NULL,
    INDEX idx_activity (activity_id),
    INDEX idx_platform (platform),
    INDEX idx_sync_status (sync_status),
    UNIQUE KEY uq_activity_platform (activity_id, platform),
    CONSTRAINT fk_activity_social_links_activity FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

