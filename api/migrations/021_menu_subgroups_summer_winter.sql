-- Migration 021: Create menu subgroups for Summer and Winter experiences
-- NAES v2.1 compliant - Idempotent, wrapped in transaction, dynamic ID lookup

START TRANSACTION;

-- 1. Resolve seasons either before or after migration 030 groups them.
SET @activities_root_id = (
    SELECT id FROM menu_items
    WHERE parent_id IS NULL AND link_type = 'anchor' AND target_value = '/#activities'
    ORDER BY id LIMIT 1
);
SET @verano_id = (
    SELECT id FROM menu_items
    WHERE link_type = 'anchor' AND target_value = '/#tours'
      AND (parent_id IS NULL OR parent_id = @activities_root_id)
    ORDER BY id LIMIT 1
);
SET @invierno_id = (
    SELECT id FROM menu_items
    WHERE link_type = 'anchor' AND target_value = '/#esqui-snow'
      AND (parent_id IS NULL OR parent_id = @activities_root_id)
    ORDER BY id LIMIT 1
);

-- ============================================================================
-- VERANO (Experiencia Verano) SUBGROUPS & ITEMS
-- ============================================================================

-- 1.1 Create group "Helitour" (Verano)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @verano_id, 'Helitour', 'anchor', '/#tours', 1, 1
FROM DUAL
WHERE @verano_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @verano_id AND label = 'Helitour' AND link_type = 'anchor'
);
SET @verano_helitour_id = (SELECT id FROM menu_items WHERE parent_id = @verano_id AND label = 'Helitour' AND link_type = 'anchor' LIMIT 1);

-- 1.2 Create group "Rafting" (Verano)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @verano_id, 'Rafting', 'anchor', '/#tours', 2, 1
FROM DUAL
WHERE @verano_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @verano_id AND label = 'Rafting' AND link_type = 'anchor'
);
SET @verano_rafting_id = (SELECT id FROM menu_items WHERE parent_id = @verano_id AND label = 'Rafting' AND link_type = 'anchor' LIMIT 1);

-- 1.3 Create group "Tour cultural" (Verano)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @verano_id, 'Tour cultural', 'anchor', '/#tours', 7, 1
FROM DUAL
WHERE @verano_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @verano_id AND label = 'Tour cultural' AND link_type = 'anchor'
);
SET @verano_cultural_id = (SELECT id FROM menu_items WHERE parent_id = @verano_id AND label = 'Tour cultural' AND link_type = 'anchor' LIMIT 1);

-- 1.4 Update display orders of remaining Verano subgroups
UPDATE menu_items SET display_order = 1 WHERE id = @verano_helitour_id;
UPDATE menu_items SET display_order = 2 WHERE id = @verano_rafting_id;
UPDATE menu_items SET display_order = 3 WHERE parent_id = @verano_id AND target_value = '/#bike' AND link_type = 'anchor';
UPDATE menu_items SET display_order = 4 WHERE parent_id = @verano_id AND target_value = '/#4x4' AND link_type = 'anchor';
UPDATE menu_items SET display_order = 5 WHERE parent_id = @verano_id AND target_value = '/#senderismo' AND link_type = 'anchor';
UPDATE menu_items SET display_order = 6 WHERE parent_id = @verano_id AND target_value = '/#via-ferrata' AND link_type = 'anchor';
UPDATE menu_items SET display_order = 7 WHERE id = @verano_cultural_id;

-- 1.5 Move Verano activities inside their corresponding new subgroups
UPDATE menu_items SET parent_id = @verano_helitour_id, display_order = 1 WHERE target_value = 'heliflight' AND link_type = 'activity' AND parent_id IN (@verano_id, @verano_helitour_id);
UPDATE menu_items SET parent_id = @verano_helitour_id, display_order = 2 WHERE target_value = 'heliflight-copia' AND link_type = 'activity' AND parent_id IN (@verano_id, @verano_helitour_id);
UPDATE menu_items SET parent_id = @verano_helitour_id, display_order = 3 WHERE target_value = 'heliflight-copia-copia' AND link_type = 'activity' AND parent_id IN (@verano_id, @verano_helitour_id);

UPDATE menu_items SET parent_id = @verano_rafting_id, display_order = 1 WHERE target_value = 'rafting-noguera' AND link_type = 'activity' AND parent_id IN (@verano_id, @verano_rafting_id);

-- ============================================================================
-- INVIERNO (Experiencia Invierno) SUBGROUPS & ITEMS
-- ============================================================================

-- 2.1 Create group "Caminata con raquetas" (Invierno)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Caminata con raquetas', 'anchor', '/#esqui-snow', 1, 1
FROM DUAL
WHERE @invierno_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_id AND label = 'Caminata con raquetas' AND link_type = 'anchor'
);
SET @invierno_raquetas_id = (SELECT id FROM menu_items WHERE parent_id = @invierno_id AND label = 'Caminata con raquetas' AND link_type = 'anchor' LIMIT 1);

-- 2.2 Create group "Esquí de montaña" (Invierno)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Esquí de montaña', 'anchor', '/#esqui-snow', 2, 1
FROM DUAL
WHERE @invierno_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_id AND label = 'Esquí de montaña' AND link_type = 'anchor'
);
SET @invierno_esqui_montana_id = (SELECT id FROM menu_items WHERE parent_id = @invierno_id AND label = 'Esquí de montaña' AND link_type = 'anchor' LIMIT 1);

-- 2.3 Create group "Esquí tour" (Invierno)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Esquí tour', 'anchor', '/#esqui-snow', 3, 1
FROM DUAL
WHERE @invierno_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_id AND label = 'Esquí tour' AND link_type = 'anchor'
);
SET @invierno_esqui_tour_id = (SELECT id FROM menu_items WHERE parent_id = @invierno_id AND label = 'Esquí tour' AND link_type = 'anchor' LIMIT 1);

-- 2.4 Create group "Helitour" (Invierno)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Helitour', 'anchor', '/#esqui-snow', 4, 1
FROM DUAL
WHERE @invierno_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_id AND label = 'Helitour' AND link_type = 'anchor'
);
SET @invierno_helitour_id = (SELECT id FROM menu_items WHERE parent_id = @invierno_id AND label = 'Helitour' AND link_type = 'anchor' LIMIT 1);

-- 2.5 Create group "Tour cultural" (Invierno)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_id, 'Tour cultural', 'anchor', '/#esqui-snow', 5, 1
FROM DUAL
WHERE @invierno_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_id AND label = 'Tour cultural' AND link_type = 'anchor'
);
SET @invierno_cultural_id = (SELECT id FROM menu_items WHERE parent_id = @invierno_id AND label = 'Tour cultural' AND link_type = 'anchor' LIMIT 1);

-- 2.6 Update display orders of Invierno subgroups
UPDATE menu_items SET display_order = 1 WHERE id = @invierno_raquetas_id;
UPDATE menu_items SET display_order = 2 WHERE id = @invierno_esqui_montana_id;
UPDATE menu_items SET display_order = 3 WHERE id = @invierno_esqui_tour_id;
UPDATE menu_items SET display_order = 4 WHERE id = @invierno_helitour_id;
UPDATE menu_items SET display_order = 5 WHERE id = @invierno_cultural_id;

-- 2.7 Move Invierno activities inside their corresponding new subgroups
UPDATE menu_items SET parent_id = @invierno_raquetas_id, display_order = 1 WHERE target_value = 'raquetas-nieve-diurna' AND link_type = 'activity' AND parent_id IN (@invierno_id, @invierno_raquetas_id);
UPDATE menu_items SET parent_id = @invierno_raquetas_id, display_order = 2 WHERE target_value = 'raquetas-nieve' AND link_type = 'activity' AND parent_id IN (@invierno_id, @invierno_raquetas_id);

UPDATE menu_items SET parent_id = @invierno_esqui_montana_id, display_order = 1 WHERE target_value = 'esqui-montana' AND link_type = 'activity' AND parent_id IN (@invierno_id, @invierno_esqui_montana_id);

UPDATE menu_items SET parent_id = @invierno_esqui_tour_id, display_order = 1 WHERE target_value = 'esqui-dia' AND link_type = 'activity' AND parent_id IN (@invierno_id, @invierno_esqui_tour_id);

-- 2.8 Create 3 NEW Helitour menu items under Invierno Helitour group (pointing to same activities)
INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_helitour_id, 'Helitour 2hs- 10 min de Vuelo', 'activity', 'heliflight', 1, 1
FROM DUAL
WHERE @invierno_helitour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_helitour_id AND target_value = 'heliflight' AND link_type = 'activity'
);

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_helitour_id, 'Helitour 2hs- 15  min de Vuelo', 'activity', 'heliflight-copia', 2, 1
FROM DUAL
WHERE @invierno_helitour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_helitour_id AND target_value = 'heliflight-copia' AND link_type = 'activity'
);

INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published)
SELECT @invierno_helitour_id, 'Helitour 2hs- 20  min de Vuelo', 'activity', 'heliflight-copia-copia', 3, 1
FROM DUAL
WHERE @invierno_helitour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items WHERE parent_id = @invierno_helitour_id AND target_value = 'heliflight-copia-copia' AND link_type = 'activity'
);

-- ============================================================================
-- TRANSLATIONS (menu_item_translations) FOR GROUPS & NEW HELITOUR ITEMS
-- ============================================================================

-- Groups: Helitour (Verano)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_helitour_id, 'ca', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_helitour_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_helitour_id, 'en', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_helitour_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_helitour_id, 'fr', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_helitour_id AND locale = 'fr');

-- Groups: Rafting (Verano)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_rafting_id, 'ca', 'Ràfting' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_rafting_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_rafting_id, 'en', 'Rafting' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_rafting_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_rafting_id, 'fr', 'Rafting' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_rafting_id AND locale = 'fr');

-- Groups: Tour cultural (Verano)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_cultural_id, 'ca', 'Tour cultural' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_cultural_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_cultural_id, 'en', 'Cultural Tour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_cultural_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @verano_cultural_id, 'fr', 'Tour culturel' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @verano_cultural_id AND locale = 'fr');

-- Groups: Caminata con raquetas (Invierno)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_raquetas_id, 'ca', 'Caminada amb raquetes' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_raquetas_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_raquetas_id, 'en', 'Snowshoe Hiking' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_raquetas_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_raquetas_id, 'fr', 'Randonnée en raquettes' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_raquetas_id AND locale = 'fr');

-- Groups: Esquí de montaña (Invierno)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_montana_id, 'ca', 'Esquí de muntanya' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_montana_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_montana_id, 'en', 'Ski Mountaineering' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_montana_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_montana_id, 'fr', 'Ski de randonnée' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_montana_id AND locale = 'fr');

-- Groups: Esquí tour (Invierno)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_tour_id, 'ca', 'Esquí tour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_tour_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_tour_id, 'en', 'Ski Tour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_tour_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_esqui_tour_id, 'fr', 'Ski tour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_esqui_tour_id AND locale = 'fr');

-- Groups: Helitour (Invierno)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_helitour_id, 'ca', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_helitour_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_helitour_id, 'en', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_helitour_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_helitour_id, 'fr', 'Helitour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_helitour_id AND locale = 'fr');

-- Groups: Tour cultural (Invierno)
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_cultural_id, 'ca', 'Tour cultural' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_cultural_id AND locale = 'ca');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_cultural_id, 'en', 'Cultural Tour' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_cultural_id AND locale = 'en');
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT @invierno_cultural_id, 'fr', 'Tour culturel' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item_translations WHERE menu_item_id = @invierno_cultural_id AND locale = 'fr');

-- Copy existing translations from Verano Helitour items to new Invierno Helitour items
INSERT INTO menu_item_translations (menu_item_id, locale, label)
SELECT w.id, t.locale, t.label
FROM menu_items w
JOIN menu_items s ON s.target_value = w.target_value AND s.parent_id = @verano_helitour_id AND s.link_type = 'activity'
JOIN menu_item_translations t ON t.menu_item_id = s.id
WHERE w.parent_id = @invierno_helitour_id AND w.link_type = 'activity'
  AND NOT EXISTS (
      SELECT 1 FROM menu_item_translations existing
      WHERE existing.menu_item_id = w.id AND existing.locale = t.locale
  );

COMMIT;
