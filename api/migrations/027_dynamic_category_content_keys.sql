-- Migration 027: preserve existing category copy under name-derived CMS keys.
-- These keys are used by the dynamic category editor and Home renderer.
START TRANSACTION;
INSERT IGNORE INTO site_content (content_key, content_value)
SELECT REPLACE(content_key, 'activities_bike_', 'activities_btt_'), content_value
FROM site_content WHERE content_key IN ('activities_bike_eyebrow', 'activities_bike_title', 'activities_bike_image');
INSERT IGNORE INTO site_content (content_key, content_value)
SELECT REPLACE(content_key, 'activities_esqui_', 'activities_esqui_snow_'), content_value
FROM site_content WHERE content_key IN ('activities_esqui_eyebrow', 'activities_esqui_title', 'activities_esqui_image');
INSERT IGNORE INTO site_content (content_key, content_value)
SELECT REPLACE(content_key, 'activities_holiday_', 'activities_andorra_holiday_snow_'), content_value
FROM site_content WHERE content_key IN ('activities_holiday_eyebrow', 'activities_holiday_title', 'activities_holiday_image');
COMMIT;
