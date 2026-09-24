-- Migration 026: preserve Christian's decision to hold Holiday & Bike until client launch approval.
-- Future publication is managed through the dashboard; no launch date is guessed here.
START TRANSACTION;
UPDATE packages SET published = 0
WHERE id IN ('andorra-holiday-8d', 'andorra-holiday-5d');
UPDATE menu_items SET published = 0
WHERE (link_type = 'package' AND target_value IN ('andorra-holiday-8d', 'andorra-holiday-5d'))
   OR (parent_id IS NULL AND target_value = '/#holiday');
COMMIT;
