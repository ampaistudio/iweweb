<?php
/**
 * iWE Dashboard API - Hero Slide Controller
 * 
 * Generic Core controller for managing dynamic hero slideshow content (images & videos).
 * Supports direct media uploads (images and videos up to 25MB) and external stream URLs (CDN, YouTube, Vimeo).
 */

declare(strict_types=1);

class HeroSlideController {
    private PDO $pdo;
    private array $config;

    public const MAX_VIDEO_SIZE_BYTES = 26214400; // 25 MB
    public const MAX_IMAGE_SIZE_BYTES = 8388608;  // 8 MB

    public const ALLOWED_MIME_TYPES = [
        // Images
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png'  => ['png'],
        'image/webp' => ['webp'],
        // Videos
        'video/mp4'  => ['mp4'],
        'video/webm' => ['webm'],
    ];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/hero-slides
     * Public endpoint: returns only published slides ordered by display_order.
     */
    public function listPublic(): void {
        $stmt = $this->pdo->query('
            SELECT id, slide_type, media_source, src, poster, alt, display_order, published, created_at, updated_at
            FROM hero_slides
            WHERE published = 1
            ORDER BY display_order ASC, id ASC
        ');
        $rows = $stmt->fetchAll();

        $items = array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['display_order'] = (int)$row['display_order'];
            $row['published'] = (int)$row['published'] === 1;
            return $row;
        }, $rows);

        jsonSuccess($items);
    }

    /**
     * GET /api/hero-slides/all
     * Protected endpoint: returns all slides (including drafts/hidden) for the dashboard.
     */
    public function listAll(): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->query('
            SELECT id, slide_type, media_source, src, poster, alt, display_order, published, created_at, updated_at
            FROM hero_slides
            ORDER BY display_order ASC, id ASC
        ');
        $rows = $stmt->fetchAll();

        $items = array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['display_order'] = (int)$row['display_order'];
            $row['published'] = (int)$row['published'] === 1;
            return $row;
        }, $rows);

        jsonSuccess($items);
    }

    /**
     * POST /api/hero-slides
     * Protected endpoint: creates a new hero slide (via direct file upload or external URL).
     */
    public function create(): void {
        requireAuth($this->pdo);

        $isUpload = isset($_FILES['file']) && is_array($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE;

        if ($isUpload) {
            $this->handleFileUploadCreation();
        } else {
            $this->handleExternalUrlCreation();
        }
    }

    /**
     * Handle direct file upload creation (Image or Video)
     */
    private function handleFileUploadCreation(): void {
        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE   => 'El archivo excede el tamaño máximo permitido por el servidor.',
                UPLOAD_ERR_FORM_SIZE  => 'El archivo excede el tamaño del formulario.',
                UPLOAD_ERR_PARTIAL    => 'El archivo se subió parcialmente.',
                UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo.',
                UPLOAD_ERR_NO_TMP_DIR => 'Falta el directorio temporal en el servidor.',
                UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en disco.',
                UPLOAD_ERR_EXTENSION  => 'Subida detenida por una extensión de PHP.',
            ];
            $msg = $uploadErrors[$file['error']] ?? 'Error desconocido al subir el archivo.';
            jsonError($msg, 400);
        }

        // Validate MIME type with finfo magic bytes
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $realMime = $finfo->file($file['tmp_name']);

        if (!array_key_exists($realMime, self::ALLOWED_MIME_TYPES)) {
            jsonError("Formato de archivo no permitido ({$realMime}). Formatos permitidos: JPG, PNG, WebP, MP4, WebM.", 422);
        }

        $isVideo = str_starts_with($realMime, 'video/');
        $maxSize = $isVideo ? self::MAX_VIDEO_SIZE_BYTES : self::MAX_IMAGE_SIZE_BYTES;

        if ($file['size'] > $maxSize) {
            $maxMb = round($maxSize / (1024 * 1024), 1);
            jsonError("El archivo supera el límite máximo permitido de {$maxMb} MB para " . ($isVideo ? 'videos' : 'imágenes') . '.', 422);
        }

        $originalExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $validExts = self::ALLOWED_MIME_TYPES[$realMime];
        $finalExt = in_array($originalExt, $validExts, true) ? $originalExt : $validExts[0];

        $uniqueFilename = 'hero_' . bin2hex(random_bytes(16)) . '.' . $finalExt;
        $uploadDir = rtrim($this->config['media']['upload_dir'] ?? (__DIR__ . '/../../uploads'), '/');

        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                jsonError('No se pudo crear el directorio de subidas en el servidor.', 500);
            }
        }

        $targetPath = $uploadDir . '/' . $uniqueFilename;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            jsonError('Error al guardar el archivo en el servidor.', 500);
        }

        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');
        $srcUrl = $publicBase . '/' . $uniqueFilename;

        // Poster handling (optional for uploaded videos)
        $posterUrl = null;
        if (isset($_FILES['poster_file']) && is_array($_FILES['poster_file']) && $_FILES['poster_file']['error'] === UPLOAD_ERR_OK) {
            $posterFile = $_FILES['poster_file'];
            $posterMime = $finfo->file($posterFile['tmp_name']);
            if (in_array($posterMime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
                $posterExt = pathinfo($posterFile['name'], PATHINFO_EXTENSION);
                $posterFilename = 'poster_' . bin2hex(random_bytes(16)) . '.' . $posterExt;
                $posterTarget = $uploadDir . '/' . $posterFilename;
                if (move_uploaded_file($posterFile['tmp_name'], $posterTarget)) {
                    $posterUrl = $publicBase . '/' . $posterFilename;
                }
            }
        } elseif (!empty($_POST['poster'])) {
            $posterUrl = trim((string)$_POST['poster']);
        }

        $alt = trim((string)($_POST['alt'] ?? ''));
        if ($alt === '') {
            jsonError('El texto alternativo (alt) es obligatorio por razones de accesibilidad.', 422);
        }

        $slideType = $isVideo ? 'video' : 'image';
        $mediaSource = 'upload';
        $published = isset($_POST['published']) ? ((int)$_POST['published'] === 1 ? 1 : 0) : 1;

        $nextOrder = (int)$this->pdo->query('SELECT COALESCE(MAX(display_order), 0) + 1 FROM hero_slides')->fetchColumn();
        $displayOrder = isset($_POST['display_order']) && $_POST['display_order'] !== '' ? (int)$_POST['display_order'] : $nextOrder;

        $stmt = $this->pdo->prepare('
            INSERT INTO hero_slides (slide_type, media_source, src, poster, alt, display_order, published, created_at, updated_at)
            VALUES (:slide_type, :media_source, :src, :poster, :alt, :display_order, :published, NOW(), NOW())
        ');

        $stmt->execute([
            'slide_type'   => $slideType,
            'media_source' => $mediaSource,
            'src'          => $srcUrl,
            'poster'       => $posterUrl,
            'alt'          => $alt,
            'display_order'=> $displayOrder,
            'published'    => $published,
        ]);

        $newId = (int)$this->pdo->lastInsertId();

        jsonSuccess([
            'id'            => $newId,
            'slide_type'    => $slideType,
            'media_source'  => $mediaSource,
            'src'           => $srcUrl,
            'poster'        => $posterUrl,
            'alt'           => $alt,
            'display_order' => $displayOrder,
            'published'     => $published === 1,
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'Diapositiva creada y subida correctamente.', 201);
    }

    /**
     * Handle external URL creation (JSON or multipart body)
     */
    private function handleExternalUrlCreation(): void {
        $body = getRequestBody();
        if (empty($body) && !empty($_POST)) {
            $body = $_POST;
        }

        $src = trim((string)($body['src'] ?? ''));
        if ($src === '') {
            jsonError('La URL de la diapositiva (src) es obligatoria.', 422);
        }

        $mediaSource = trim((string)($body['media_source'] ?? 'external_url'));
        if (!in_array($mediaSource, ['upload', 'external_url'], true)) {
            $mediaSource = 'external_url';
        }

        // Validate URL format for external URLs
        if ($mediaSource === 'external_url' && !filter_var($src, FILTER_VALIDATE_URL) && !str_starts_with($src, '/')) {
            jsonError('La URL proporcionada no tiene un formato válido.', 422);
        }

        $slideType = strtolower(trim((string)($body['slide_type'] ?? 'image')));
        if (!in_array($slideType, ['image', 'video'], true)) {
            $slideType = 'image';
        }

        $alt = trim((string)($body['alt'] ?? ''));
        if ($alt === '') {
            jsonError('El texto alternativo (alt) es obligatorio por razones de accesibilidad.', 422);
        }

        $poster = !empty($body['poster']) ? trim((string)$body['poster']) : null;
        $published = isset($body['published']) ? ((bool)$body['published'] ? 1 : 0) : 1;

        $nextOrder = (int)$this->pdo->query('SELECT COALESCE(MAX(display_order), 0) + 1 FROM hero_slides')->fetchColumn();
        $displayOrder = isset($body['display_order']) && $body['display_order'] !== null ? (int)$body['display_order'] : $nextOrder;

        $stmt = $this->pdo->prepare('
            INSERT INTO hero_slides (slide_type, media_source, src, poster, alt, display_order, published, created_at, updated_at)
            VALUES (:slide_type, :media_source, :src, :poster, :alt, :display_order, :published, NOW(), NOW())
        ');

        $stmt->execute([
            'slide_type'   => $slideType,
            'media_source' => $mediaSource,
            'src'          => $src,
            'poster'       => $poster,
            'alt'          => $alt,
            'display_order'=> $displayOrder,
            'published'    => $published,
        ]);

        $newId = (int)$this->pdo->lastInsertId();

        jsonSuccess([
            'id'            => $newId,
            'slide_type'    => $slideType,
            'media_source'  => $mediaSource,
            'src'           => $src,
            'poster'        => $poster,
            'alt'           => $alt,
            'display_order' => $displayOrder,
            'published'     => $published === 1,
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'Diapositiva creada correctamente.', 201);
    }

    /**
     * PUT /api/hero-slides/:id
     * Protected endpoint: update an existing slide.
     */
    public function update(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT * FROM hero_slides WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $slide = $stmt->fetch();

        if (!$slide) {
            jsonError('Diapositiva no encontrada.', 404);
        }

        $body = getRequestBody();

        $slideType = isset($body['slide_type']) ? strtolower(trim((string)$body['slide_type'])) : $slide['slide_type'];
        if (!in_array($slideType, ['image', 'video'], true)) {
            $slideType = $slide['slide_type'];
        }

        $mediaSource = isset($body['media_source']) ? trim((string)$body['media_source']) : $slide['media_source'];
        if (!in_array($mediaSource, ['upload', 'external_url'], true)) {
            $mediaSource = $slide['media_source'];
        }

        $src = isset($body['src']) ? trim((string)$body['src']) : $slide['src'];
        if ($src === '') {
            jsonError('La URL o ruta del recurso no puede estar vacía.', 422);
        }

        $alt = isset($body['alt']) ? trim((string)$body['alt']) : $slide['alt'];
        if ($alt === '') {
            jsonError('El texto alternativo (alt) no puede estar vacío.', 422);
        }

        $poster = array_key_exists('poster', $body) 
            ? (!empty($body['poster']) ? trim((string)$body['poster']) : null)
            : $slide['poster'];

        $published = isset($body['published']) 
            ? ((bool)$body['published'] ? 1 : 0) 
            : (int)$slide['published'];

        $displayOrder = isset($body['display_order']) 
            ? (int)$body['display_order'] 
            : (int)$slide['display_order'];

        $stmtUpd = $this->pdo->prepare('
            UPDATE hero_slides
            SET slide_type = :slide_type,
                media_source = :media_source,
                src = :src,
                poster = :poster,
                alt = :alt,
                display_order = :display_order,
                published = :published,
                updated_at = NOW()
            WHERE id = :id
        ');

        $stmtUpd->execute([
            'id'           => $id,
            'slide_type'   => $slideType,
            'media_source' => $mediaSource,
            'src'          => $src,
            'poster'       => $poster,
            'alt'          => $alt,
            'display_order'=> $displayOrder,
            'published'    => $published,
        ]);

        jsonSuccess([
            'id'            => $id,
            'slide_type'    => $slideType,
            'media_source'  => $mediaSource,
            'src'           => $src,
            'poster'        => $poster,
            'alt'           => $alt,
            'display_order' => $displayOrder,
            'published'     => $published === 1,
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'Diapositiva actualizada correctamente.');
    }

    /**
     * DELETE /api/hero-slides/:id
     * Protected endpoint: delete a slide.
     */
    public function delete(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id, media_source, src, poster FROM hero_slides WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $slide = $stmt->fetch();

        if (!$slide) {
            jsonError('Diapositiva no encontrada.', 404);
        }

        // If it was an upload, clean up files from disk if they are in /api/uploads
        $uploadDir = rtrim($this->config['media']['upload_dir'] ?? (__DIR__ . '/../../uploads'), '/');
        if ($slide['media_source'] === 'upload' && str_contains($slide['src'], '/uploads/')) {
            $filename = basename(parse_url($slide['src'], PHP_URL_PATH));
            $filePath = $uploadDir . '/' . $filename;
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }

        if (!empty($slide['poster']) && str_contains($slide['poster'], '/uploads/')) {
            $posterFile = basename(parse_url($slide['poster'], PHP_URL_PATH));
            $posterPath = $uploadDir . '/' . $posterFile;
            if (file_exists($posterPath)) {
                @unlink($posterPath);
            }
        }

        $stmtDel = $this->pdo->prepare('DELETE FROM hero_slides WHERE id = :id');
        $stmtDel->execute(['id' => $id]);

        jsonSuccess(null, 'Diapositiva eliminada correctamente.');
    }

    /**
     * PUT /api/hero-slides/reorder
     * Protected endpoint: atomic bulk reordering of slides.
     */
    public function reorder(): void {
        requireAuth($this->pdo);

        $body = getRequestBody();
        $ids = $body['ids'] ?? null;

        if (!is_array($ids) || empty($ids)) {
            jsonError('Se requiere un array de identificadores (ids) para reordenar.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE hero_slides SET display_order = :order, updated_at = NOW() WHERE id = :id');
            foreach ($ids as $index => $id) {
                $stmt->execute([
                    'order' => (int)$index + 1,
                    'id'    => (int)$id,
                ]);
            }
            $this->pdo->commit();

            jsonSuccess(null, 'Orden de diapositivas actualizado correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al guardar el nuevo orden: ' . $e->getMessage(), 500);
        }
    }
}

