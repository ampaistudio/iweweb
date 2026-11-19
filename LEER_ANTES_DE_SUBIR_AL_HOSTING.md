# iWE — carpeta vigente para la próxima subida al hosting

Actualizado: 2026-11-01.

**La carpeta de origen vigente es `iwe_test`. No usar `iwe-web` ni paquetes anteriores.**

Ruta completa:
`/Users/christian/Documents/CEREBRO DIGITAL /02_PROYECTOS/01-NODO AI AGENCY/B-WEB WORLD/07-IWE/iwe_test`

## Estado local

- Correcciones de seguridad de acceso, caché de reseñas y protección de archivos privados aplicadas en esta carpeta.
- Web compilada en `dist/`: `npm run build` correcto.
- Dashboard compilado en `admin-panel/dist/`: `npm run build` correcto, con advertencia de tamaño del bundle, no error.
- Reglas de archivos privados verificadas en PHP y Apache con PHP-FPM locales. Hosting todavía no modificado ni validado.
- Cambios pendientes de commit y subida. Esta nota no declara cerrado el despliegue en producción.

## Correspondencia para la subida

`iwe_test` es el origen del proyecto, no una carpeta que deba copiarse íntegra al directorio público.

| Origen en iwe_test | Destino en la raíz pública del sitio |
| --- | --- |
| Contenido de `dist/` | Raíz pública (`index.html`, `robots.txt`, etc.) |
| `index.php` y `.htaccess` | Raíz pública, incluidos los archivos ocultos |
| `api/` — código PHP y reglas `.htaccess` | `api/`, conservando estructura |
| `admin-panel/dist/` | `admin-panel/dist/` |
| `assets/` y medios necesarios de `api/uploads/` | Mismas rutas, sin borrar medios existentes |

**No subir el `index.html` de la raíz del proyecto:** es la entrada de desarrollo. Subir el generado en `dist/`.

Incluir los nuevos `api/core/PublicFilePolicy.php` y `api/core/reviews/ReviewsCache.php`, además de los controladores modificados. Incluir `.htaccess` raíz y los de `api/`, `api/storage/`, `api/uploads/` y cualquier otro existente en la estructura de destino.

Preservar la configuración de producción: no reemplazar `api/config/config.local.php` ni archivos `.env` por los locales. Mantener sus credenciales y dominio reales. No copiar cachés, sesiones ni contadores temporales locales. No borrar uploads del hosting.

No publicar `.git`, `.audit`, `node_modules`, fuentes `src`, tests, scripts, grafo, esta nota ni migraciones SQL en la raíz pública. Las correcciones de seguridad de esta tanda no añaden migraciones de base de datos; no ejecutar de nuevo migraciones históricas.

Esta nota identifica la versión local a desplegar. Antes de una subida real, preparar copia de seguridad y verificar después las rutas, dashboard, imágenes y configuración del servidor. No se ha realizado FTP ni deploy remoto en esta sesión.

## Importación de Instagram a Novedades

El script `api/scripts/import-instagram-news.php` consulta la cuenta profesional configurada en Meta. Importa el texto, la fecha y el enlace original. Usa la relación existente entre novedad e ID de Instagram para evitar duplicados. Por ahora, los videos se abren desde el enlace de Instagram.

Primero ejecutar desde la terminal del servidor `php api/scripts/import-instagram-news.php --since=AAAA-MM-DD` con la fecha acordada para el corte. Eso muestra cuántas publicaciones entran en el período. Tras verificar la cuenta y el resultado, agregar `--apply` para crear las novedades. La automatización requiere que ese comando se programe en cron después de validar una cuenta de prueba.
