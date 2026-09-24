-- =============================================================================
-- Migration 020: Add reference_channels to posts
-- Stores JSON array of selected reference broadcast channels per post (e.g. ["whatsapp", "telegram"])
-- =============================================================================

ALTER TABLE posts
ADD COLUMN reference_channels JSON NULL AFTER origin;

