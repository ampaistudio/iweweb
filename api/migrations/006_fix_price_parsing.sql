-- ==============================================================================
-- Migración 006: Corrección robusta de extracción y parseo de precios estructurados
-- Base de Datos: iwe_dashboard / iwe_dashboard_local
-- Fecha: 2026-09-17
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RATIONALE & CONTEXTO TÉCNICO:
-- En la migración 005, la extracción de precios desde la columna histórica `price`
-- utilizaba condiciones LIKE '%80%' y LIKE '%85%'.
-- 
-- Problema detectado:
-- 1. Es frágil ante montos no contemplados (ej: '150', '180', '285', '495.50') donde
--    o bien no matcheaban (dejando price_amount en NULL como ocurrió con la fila 'm')
--    o bien producían falsos positivos por substrings en precios mayores.
-- 2. No permitía la extracción automática y limpia de cualquier valor numérico futuro.
--
-- Solución implementada:
-- Uso de extracción regular mediante `REGEXP_SUBSTR(price, '[0-9]+(\\.[0-9]+)?')`
-- compatible con MySQL 8.0+, MariaDB 10.0.5+ y Hostinger Cloud Database.
-- Se asegura que cualquier número entero o decimal contenido en el campo `price`
-- sea convertido con precisión a DECIMAL(10,2) sin alterar registros ya existentes.
-- ------------------------------------------------------------------------------

-- Actualizar price_amount extrayendo cualquier valor numérico (entero o decimal) presente en `price`
UPDATE activities 
SET price_amount = CAST(REGEXP_SUBSTR(price, '[0-9]+(\\.[0-9]+)?') AS DECIMAL(10,2))
WHERE price IS NOT NULL 
  AND REGEXP_SUBSTR(price, '[0-9]+(\\.[0-9]+)?') IS NOT NULL;

-- Asegurar coherencia de moneda (EUR por defecto, o USD si contiene $ / USD)
UPDATE activities 
SET price_currency = CASE 
    WHEN price LIKE '%$%' OR UPPER(price) LIKE '%USD%' THEN 'USD'
    ELSE 'EUR'
END
WHERE price IS NOT NULL;

-- Asignar unidad correspondiente si contiene 'persona', 'grupo', 'hora' o 'día'
UPDATE activities 
SET price_unit = CASE 
    WHEN LOWER(price) LIKE '%persona%' THEN 'por persona'
    WHEN LOWER(price) LIKE '%grupo%' THEN 'por grupo'
    WHEN LOWER(price) LIKE '%hora%' THEN 'por hora'
    WHEN LOWER(price) LIKE '%d_a%' THEN 'por día'
    ELSE price_unit
END
WHERE price IS NOT NULL;

