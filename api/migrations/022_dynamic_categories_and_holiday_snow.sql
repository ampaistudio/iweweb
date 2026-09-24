-- Migration 022: Ensure dynamic activity types table contains Andorra Holiday & Snow category
-- NAES v2.1 compliant - Idempotent, wrapped in transaction

START TRANSACTION;

-- Insert 'Andorra Holiday & Snow' category into activity_types if it does not exist
INSERT INTO `activity_types` (`name`, `display_order`)
SELECT 'Andorra Holiday & Snow', 8
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `activity_types` WHERE LOWER(`name`) = LOWER('Andorra Holiday & Snow')
);

COMMIT;
