-- Migration 029: Complete Tour Cultural across Summer and Winter menus
-- One editable activity is linked from both seasonal menu groups.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO activity_types (name, display_order)
SELECT 'Tour Cultural', COALESCE(MAX(display_order), 0) + 1
FROM activity_types
WHERE NOT EXISTS (
  SELECT 1 FROM activity_types WHERE LOWER(name) = LOWER('Tour Cultural')
);

INSERT INTO activities (
  id,
  title,
  region,
  country,
  type,
  level,
  duration,
  image_url,
  alt_text,
  price,
  price_amount,
  price_currency,
  price_unit,
  description,
  intro_title,
  intro_text,
  display_order,
  published
)
SELECT
  'tour-cultural',
  'Tour Cultural',
  'Andorra',
  'Andorra',
  'Tour Cultural',
  'Todos los niveles',
  'A definir',
  '',
  'Tour cultural en Andorra',
  NULL,
  NULL,
  'EUR',
  'por persona',
  'Descubrí el patrimonio, la historia y la cultura de Andorra acompañado por un guía local.',
  'Conocé otra cara de Andorra',
  'Una experiencia cultural editable desde el dashboard y disponible durante todo el año.',
  COALESCE((SELECT MAX(a.display_order) FROM activities a), 0) + 1,
  1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM activities WHERE id = 'tour-cultural'
);

SET @verano_id = (
  SELECT id FROM menu_items
  WHERE parent_id IS NULL AND target_value = '/#tours'
  ORDER BY id LIMIT 1
);
SET @invierno_id = (
  SELECT id FROM menu_items
  WHERE parent_id IS NULL AND target_value = '/#esqui-snow'
  ORDER BY id LIMIT 1
);

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @verano_id, 'Tour Cultural', 'anchor', '/#tour-cultural',
       COALESCE((SELECT MAX(m.display_order) FROM menu_items m WHERE m.parent_id = @verano_id), 0) + 1,
       1
FROM DUAL
WHERE @verano_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM menu_items
    WHERE parent_id = @verano_id
      AND LOWER(label) = LOWER('Tour Cultural')
      AND link_type = 'anchor'
  );

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Tour Cultural', 'anchor', '/#tour-cultural',
       COALESCE((SELECT MAX(m.display_order) FROM menu_items m WHERE m.parent_id = @invierno_id), 0) + 1,
       1
FROM DUAL
WHERE @invierno_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM menu_items
    WHERE parent_id = @invierno_id
      AND LOWER(label) = LOWER('Tour Cultural')
      AND link_type = 'anchor'
  );

SET @verano_cultural_id = (
  SELECT id FROM menu_items
  WHERE parent_id = @verano_id
    AND LOWER(label) = LOWER('Tour Cultural')
    AND link_type = 'anchor'
  ORDER BY id LIMIT 1
);
SET @invierno_cultural_id = (
  SELECT id FROM menu_items
  WHERE parent_id = @invierno_id
    AND LOWER(label) = LOWER('Tour Cultural')
    AND link_type = 'anchor'
  ORDER BY id LIMIT 1
);

UPDATE menu_items
SET label = 'Tour Cultural', target_value = '/#tour-cultural', published = 1
WHERE id IN (@verano_cultural_id, @invierno_cultural_id);

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @verano_cultural_id, 'Tour Cultural', 'activity', 'tour-cultural', 1, 1
FROM DUAL
WHERE @verano_cultural_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM menu_items
    WHERE parent_id = @verano_cultural_id
      AND link_type = 'activity'
      AND target_value = 'tour-cultural'
  );

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_cultural_id, 'Tour Cultural', 'activity', 'tour-cultural', 1, 1
FROM DUAL
WHERE @invierno_cultural_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM menu_items
    WHERE parent_id = @invierno_cultural_id
      AND link_type = 'activity'
      AND target_value = 'tour-cultural'
  );

INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT item.id, translations.locale, translations.label
FROM menu_items item
JOIN (
  SELECT 'ca' AS locale, 'Tour Cultural' AS label
  UNION ALL SELECT 'en', 'Cultural Tour'
  UNION ALL SELECT 'fr', 'Tour culturel'
) translations
WHERE item.id IN (
  @verano_cultural_id,
  @invierno_cultural_id,
  (SELECT id FROM menu_items WHERE parent_id = @verano_cultural_id AND link_type = 'activity' AND target_value = 'tour-cultural' ORDER BY id LIMIT 1),
  (SELECT id FROM menu_items WHERE parent_id = @invierno_cultural_id AND link_type = 'activity' AND target_value = 'tour-cultural' ORDER BY id LIMIT 1)
)
ON DUPLICATE KEY UPDATE label = VALUES(label);

COMMIT;
