-- =============================================================================
-- Migration 019: Add must_change_password flag to users
-- Forces newly seeded or flagged accounts to reset their initial/seed password
-- before accessing any dashboard features (SEC-01).
-- =============================================================================

ALTER TABLE users
ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER role;

-- Backfill: force password change for seed users from migration 002
UPDATE users
SET must_change_password = 1
WHERE email IN ('christian@nodoai.com', 'charly@isardwildland.com');
