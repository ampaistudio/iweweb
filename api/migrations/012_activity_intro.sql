-- =============================================================================
-- iWE Dashboard - Migration 012: Activity Intro Block (title + short text)
-- Target: MySQL 5.7+ / MySQL 8.0+ (Hostinger Native)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
--
-- Adds an optional intro block (title + short paragraph) shown on the public
-- tour page between the hero and the technical specs box. Nullable in both
-- the base (ES) table and the translations table so existing activities keep
-- working without requiring immediate content — reversible, no data loss.
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE activities
  ADD COLUMN intro_title VARCHAR(200) NULL AFTER description,
  ADD COLUMN intro_text TEXT NULL AFTER intro_title;

ALTER TABLE activity_translations
  ADD COLUMN intro_title VARCHAR(200) NULL AFTER description,
  ADD COLUMN intro_text TEXT NULL AFTER intro_title;
