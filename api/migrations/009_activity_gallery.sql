-- ==============================================================================
-- Migración 009: Galería Multi-imagen para Actividades (activity_images)
-- Base de Datos: iwe_dashboard / iwe_dashboard_local
-- Fecha: 2026-09-17
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RATIONALE & CONTEXTO TÉCNICO:
-- 1. Permite múltiples fotos por actividad turística para enriquecer la página
--    de detalle del tour (`TourDetail.tsx`) y el editor del dashboard.
-- 2. Cada actividad tiene exactamente una imagen marcada como portada (`is_cover = 1`),
--    utilizada como thumbnail en tarjetas de listado y como imagen principal.
-- 3. La columna `image_url` en `activities` se preserva para retrocompatibilidad
--    y fallback.
-- 4. Seed: Migra la imagen inicial de cada actividad como primer elemento de su
--    galería (`is_cover = 1`, `display_order = 0`).
-- ------------------------------------------------------------------------------

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS activity_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(80) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(300) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_images_activity FOREIGN KEY (activity_id)
    REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_activity_images_activity_order (activity_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: migrar la imagen única existente de cada activity como su primera imagen de galería
-- (is_cover = 1), para que ninguna actividad quede sin al menos 1 foto en la galería nueva.
INSERT INTO activity_images (activity_id, image_url, alt_text, display_order, is_cover)
SELECT id, image_url, alt_text, 0, 1 
FROM activities a
WHERE NOT EXISTS (
    SELECT 1 FROM activity_images ai WHERE ai.activity_id = a.id
);

