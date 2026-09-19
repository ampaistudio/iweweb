-- =============================================================================
-- Migration 012: Add role column to users table
-- =============================================================================

ALTER TABLE users 
ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'admin' AFTER display_name;

-- Ensure all current users have admin role
UPDATE users SET role = 'admin' WHERE role IS NULL OR role = '';

