-- Migration 024: initialize the editable Holiday & Snow section image from a real winter activity.
-- Existing CMS image always wins; no image is synthesized if the winter category is empty.
SET NAMES utf8mb4;
START TRANSACTION;
INSERT IGNORE INTO site_content (content_key, content_value)
SELECT 'activities_holiday_image', image_url
FROM activities
WHERE type = 'Esquí-Snow' AND image_url IS NOT NULL AND image_url <> ''
ORDER BY display_order, id
LIMIT 1;
COMMIT;
