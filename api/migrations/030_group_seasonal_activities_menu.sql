-- Group the two existing seasonal menu branches under one editable root item.
-- Safe to rerun: existing rows, schedules, labels and child links are preserved.
SET NAMES utf8mb4;
START TRANSACTION;

SET @activities_root_id = (
  SELECT id FROM menu_items
  WHERE parent_id IS NULL AND link_type = 'anchor' AND target_value = '/#activities'
  ORDER BY id LIMIT 1
);

SET @summer_root_id = (
  SELECT id FROM menu_items
  WHERE link_type = 'anchor' AND target_value = '/#tours'
    AND (parent_id IS NULL OR parent_id = @activities_root_id)
  ORDER BY id LIMIT 1
);
SET @winter_root_id = (
  SELECT id FROM menu_items
  WHERE link_type = 'anchor' AND target_value = '/#esqui-snow'
    AND (parent_id IS NULL OR parent_id = @activities_root_id)
  ORDER BY id LIMIT 1
);

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT NULL, 'Actividades', 'anchor', '/#activities',
       (SELECT COALESCE(MIN(display_order), 4) FROM menu_items WHERE id IN (@summer_root_id, @winter_root_id)), 1
FROM DUAL
WHERE @activities_root_id IS NULL AND @summer_root_id IS NOT NULL AND @winter_root_id IS NOT NULL;

SET @activities_root_id = (
  SELECT id FROM menu_items
  WHERE parent_id IS NULL AND link_type = 'anchor' AND target_value = '/#activities'
  ORDER BY id LIMIT 1
);

UPDATE menu_items SET parent_id = @activities_root_id, display_order = 1
WHERE id = @summer_root_id AND @activities_root_id IS NOT NULL
  AND (parent_id IS NULL OR parent_id = @activities_root_id);
UPDATE menu_items SET parent_id = @activities_root_id, display_order = 2
WHERE id = @winter_root_id AND @activities_root_id IS NOT NULL
  AND (parent_id IS NULL OR parent_id = @activities_root_id);

INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @activities_root_id, 'ca', 'Activitats' FROM DUAL
WHERE @activities_root_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM menu_item_translations WHERE menu_item_id = @activities_root_id AND locale = 'ca'
);
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @activities_root_id, 'en', 'Activities' FROM DUAL
WHERE @activities_root_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM menu_item_translations WHERE menu_item_id = @activities_root_id AND locale = 'en'
);
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @activities_root_id, 'fr', 'Activités' FROM DUAL
WHERE @activities_root_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM menu_item_translations WHERE menu_item_id = @activities_root_id AND locale = 'fr'
);

COMMIT;
