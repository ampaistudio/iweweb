-- Migration 025: Christian requested these two root menu entries hidden.
-- Identify by stable destination so dashboard reinserted IDs do not matter.
START TRANSACTION;
UPDATE menu_items
SET published = 0
WHERE parent_id IS NULL
  AND target_value IN ('/#viajes-medida', '/#eventos-deportivos');
COMMIT;
