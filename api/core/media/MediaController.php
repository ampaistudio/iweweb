<?php
/**
 * iWE Dashboard API - Media Controller
 * 
 * Handles secure file uploads, media library listing, and safe deletion.
 * Fully decoupled from domain models (uses registered usage checkers for referential checks).
 */

class MediaController {
    private PDO $pdo;
    private array $config;
    /** @var callable[] */
    private array $usageCheckers = [];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Register a domain-level callback to verify if a media file is in use before deletion.
     * Callback signature: function(array $media, PDO $pdo): ?string (returns conflict error string or null)
     */
    public function addUsageChecker(callable $checker): void {
        $this->usageCheckers[] = $checker;
    }

    /**
     * POST /api/media
     * Upload an image file (requires authentication)
     */
    public function upload(): void {
        $user = requireAuth($this->pdo);

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            jsonError('No se recibió ningún archivo.', 422);
        }

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

        $mediaConfig = $this->config['media'] ?? [];
        $maxSizeBytes = $mediaConfig['max_size_bytes'] ?? (8 * 1024 * 1024);
        $allowedMimes = $mediaConfig['allowed_mimes'] ?? [
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png'  => ['png'],
            'image/webp' => ['webp'],
        ];

        // Check file size
        if ($file['size'] > $maxSizeBytes) {
            $maxMb = round($maxSizeBytes / (1024 * 1024), 1);
            jsonError("El archivo supera el límite máximo permitido de {$maxMb} MB.", 422);
        }

        // Validate real MIME type via magic bytes
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $realMime = $finfo->file($file['tmp_name']);

        if (!array_key_exists($realMime, $allowedMimes)) {
            jsonError("Formato de archivo no permitido ({$realMime}). Formatos aceptados: JPG, PNG, WebP.", 422);
        }

        // Determine extension safely
        $originalExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $validExts = $allowedMimes[$realMime];
        $finalExt = in_array($originalExt, $validExts, true) ? $originalExt : $validExts[0];

        // Generate randomized cryptographic filename
        $randomPrefix = bin2hex(random_bytes(16));
        $uploadDir = rtrim($mediaConfig['upload_dir'] ?? (__DIR__ . '/../../uploads'), '/');

        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                jsonError('No se pudo crear el directorio de subidas en el servidor.', 500);
            }
        }

        // WebP Optimization Pipeline via PHP GD
        $webpFilename = $randomPrefix . '.webp';
        $webpTargetPath = $uploadDir . '/' . $webpFilename;
        $fallbackFilename = $randomPrefix . '.' . $finalExt;
        $fallbackTargetPath = $uploadDir . '/' . $fallbackFilename;

        $processedWebp = self::optimizeToWebp($file['tmp_name'], $webpTargetPath, $realMime);

        if ($processedWebp) {
            $finalFilename = $webpFilename;
            $finalMime = 'image/webp';
            $finalSize = filesize($webpTargetPath);
        } else {
            // Fallback: preserve original format
            if (!move_uploaded_file($file['tmp_name'], $fallbackTargetPath)) {
                jsonError('Error al guardar el archivo en el servidor.', 500);
            }
            $finalFilename = $fallbackFilename;
            $finalMime = $realMime;
            $finalSize = (int)$file['size'];
        }

        // Insert into database
        $stmt = $this->pdo->prepare('
            INSERT INTO media (filename, original_name, mime_type, size_bytes, uploaded_by, created_at)
            VALUES (:filename, :original_name, :mime_type, :size_bytes, :uploaded_by, NOW())
        ');

        $stmt->execute([
            'filename'     => $finalFilename,
            'original_name'=> basename($file['name']),
            'mime_type'    => $finalMime,
            'size_bytes'   => (int)$finalSize,
            'uploaded_by'  => $user['id'],
        ]);

        $mediaId = (int)$this->pdo->lastInsertId();
        $publicBase = rtrim($mediaConfig['public_path'] ?? '/api/uploads', '/');

        jsonSuccess([
            'id'            => $mediaId,
            'filename'      => $finalFilename,
            'original_name' => basename($file['name']),
            'url'           => $publicBase . '/' . $finalFilename,
            'mime_type'     => $finalMime,
            'size_bytes'    => (int)$finalSize,
            'created_at'    => date('Y-m-d H:i:s'),
        ], 'Archivo subido y optimizado correctamente.', 201);
    }

    /**
     * Converts and proportionally resizes an image to WebP format using PHP GD.
     */
    public static function optimizeToWebp(
        string $sourcePath,
        string $destPath,
        string $mime,
        int $maxWidth = 1920,
        int $maxHeight = 1920,
        int $quality = 85
    ): bool {
        if (!extension_loaded('gd') || !function_exists('imagewebp')) {
            return false;
        }

        $srcImg = null;
        switch ($mime) {
            case 'image/jpeg':
                $srcImg = @imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $srcImg = @imagecreatefrompng($sourcePath);
                break;
            case 'image/webp':
                $srcImg = @imagecreatefromwebp($sourcePath);
                break;
            default:
                return false;
        }

        if (!$srcImg) {
            return false;
        }

        $origW = imagesx($srcImg);
        $origH = imagesy($srcImg);

        if ($origW <= 0 || $origH <= 0) {
            return false;
        }

        $targetW = $origW;
        $targetH = $origH;

        if ($origW > $maxWidth || $origH > $maxHeight) {
            $ratio = min($maxWidth / $origW, $maxHeight / $origH);
            $targetW = (int)round($origW * $ratio);
            $targetH = (int)round($origH * $ratio);
        }

        $dstImg = imagecreatetruecolor($targetW, $targetH);
        if (!$dstImg) {
            return false;
        }

        imagealphablending($dstImg, false);
        imagesavealpha($dstImg, true);
        $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
        imagefilledrectangle($dstImg, 0, 0, $targetW, $targetH, $transparent);

        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $targetW, $targetH, $origW, $origH);

        $saved = imagewebp($dstImg, $destPath, $quality);

        return $saved && file_exists($destPath) && filesize($destPath) > 0;
    }

    /**
     * GET /api/media
     * List all uploaded media files (requires authentication)
     */
    public function list(): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->query('
            SELECT m.id, m.filename, m.original_name, m.mime_type, m.size_bytes, m.created_at,
                   u.display_name AS uploaded_by_name
            FROM media m
            LEFT JOIN users u ON m.uploaded_by = u.id
            ORDER BY m.created_at DESC
        ');

        $rows = $stmt->fetchAll();
        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');

        $items = array_map(function ($row) use ($publicBase) {
            $row['url'] = $publicBase . '/' . $row['filename'];
            return $row;
        }, $rows);

        jsonSuccess($items);
    }

    /**
     * DELETE /api/media/:id
     * Delete an image if it is not currently referenced by core or domain entities
     */
    public function delete(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id, filename FROM media WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $media = $stmt->fetch();

        if (!$media) {
            jsonError('Archivo multimedia no encontrado.', 404);
        }

        // 1. Check core references (posts)
        $stmtPost = $this->pdo->prepare('SELECT id, title FROM posts WHERE cover_media_id = :id LIMIT 1');
        $stmtPost->execute(['id' => $id]);
        $postRef = $stmtPost->fetch();
        if ($postRef) {
            jsonError("No se puede eliminar la imagen porque está en uso como portada en el post '{$postRef['title']}'.", 409);
        }

        // 2. Check registered domain usage checkers (e.g. domain entities)
        foreach ($this->usageCheckers as $checker) {
            $conflict = $checker($media, $this->pdo);
            if ($conflict !== null) {
                jsonError($conflict, 409);
            }
        }

        // 3. Remove from disk
        $uploadDir = rtrim($this->config['media']['upload_dir'] ?? (__DIR__ . '/../../uploads'), '/');
        $filePath = $uploadDir . '/' . $media['filename'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }

        // 4. Delete from database
        $stmtDel = $this->pdo->prepare('DELETE FROM media WHERE id = :id');
        $stmtDel->execute(['id' => $id]);

        jsonSuccess(null, 'Archivo eliminado correctamente.');
    }
}
