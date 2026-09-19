-- Migration 014: Add dynamic activity types table and seed existing categories
CREATE TABLE IF NOT EXISTS `activity_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `display_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `activity_types` (`name`, `display_order`) VALUES
('BTT', 1),
('4x4', 2),
('Vía Ferrata', 3),
('Senderismo', 4),
('Esquí-Snow', 5),
('Rafting', 6),
('Heliflight', 7)
ON DUPLICATE KEY UPDATE `display_order` = VALUES(`display_order`);
