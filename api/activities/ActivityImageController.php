<?php
/**
 * iWE Dashboard API - Activity Image Controller
 * 
 * Manages gallery images, videos, covers, and reordering for tourism activities.
 */

declare(strict_types=1);

class ActivityImageController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * POST /api/activities/:id/images
     * Add a new image/video to activity gallery.
     */
    public function addImage(string $activityId): void {
        requireAuth($this->pdo);

        $stmtAct = $this->pdo->prepare('SELECT id, title, image_url, alt_text FROM activities WHERE id = :id LIMIT 1');
        $stmtAct->execute(['id' => $activityId]);
        $activity = $stmtAct->fetch();
        if (!$activity) {
            jsonError('Actividad no encontrada.', 404);
        }

        $body = getRequestBody();
        $imageUrl = trim((string)($body['image_url'] ?? $body['image'] ?? ''));
        $altText = trim((string)($body['alt_text'] ?? $body['alt'] ?? ''));

        if (empty($imageUrl)) {
            jsonError('La URL de la imagen es obligatoria.', 422, ['image_url' => 'Campo obligatorio.']);
        }
        if (empty($altText)) {
            $altText = $activity['title'];
        }

        // Count existing images
        $stmtCount = $this->pdo->prepare('SELECT COUNT(*) as count, COALESCE(MAX(display_order), -1) as max_order FROM activity_images WHERE activity_id = :act_id');
        $stmtCount->execute(['act_id' => $activityId]);
        $stats = $stmtCount->fetch();
        $count = (int)$stats['count'];
        $nextOrder = (int)$stats['max_order'] + 1;

        $mediaType = in_array($body['media_type'] ?? '', ['image', 'video'], true) ? $body['media_type'] : 'image';
        $posterUrl = !empty($body['poster_url']) ? trim((string)$body['poster_url']) : null;

        $isCover = $count === 0 ? 1 : ((isset($body['is_cover']) && $body['is_cover']) ? 1 : 0);

        $this->pdo->beginTransaction();
        try {
            if ($isCover === 1) {
                $stmtUnset = $this->pdo->prepare('UPDATE activity_images SET is_cover = 0 WHERE activity_id = :act_id');
                $stmtUnset->execute(['act_id' => $activityId]);

                $stmtUpdateAct = $this->pdo->prepare('UPDATE activities SET image_url = :img, alt_text = :alt, updated_at = NOW() WHERE id = :act_id');
                $stmtUpdateAct->execute(['img' => $imageUrl, 'alt' => $altText, 'act_id' => $activityId]);
            }

            $stmtInsert = $this->pdo->prepare('
                INSERT INTO activity_images (activity_id, image_url, media_type, poster_url, alt_text, display_order, is_cover, created_at)
                VALUES (:act_id, :image_url, :media_type, :poster_url, :alt_text, :display_order, :is_cover, NOW())
            ');
            $stmtInsert->execute([
                'act_id'        => $activityId,
                'image_url'     => $imageUrl,
                'media_type'    => $mediaType,
                'poster_url'    => $posterUrl,
                'alt_text'      => $altText,
                'display_order' => $nextOrder,
                'is_cover'      => $isCover,
            ]);
            $newId = (int)$this->pdo->lastInsertId();

            $this->pdo->commit();

            jsonSuccess([
                'id'            => $newId,
                'activity_id'   => $activityId,
                'image_url'     => $imageUrl,
                'media_type'    => $mediaType,
                'poster_url'    => $posterUrl,
                'alt_text'      => $altText,
                'display_order' => $nextOrder,
                'is_cover'      => (bool)$isCover,
            ], 'Elemento agregado a la galería.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al guardar en la galería.', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/activities/:id/images/:imageId
     * Remove image from gallery. Promotes next image to cover if cover was removed.
     */
    public function removeImage(int $imageId): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT * FROM activity_images WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $imageId]);
        $image = $stmt->fetch();
        if (!$image) {
            jsonError('Imagen no encontrada.', 404);
        }

        $activityId = $image['activity_id'];
        $wasCover = (bool)$image['is_cover'];

        $this->pdo->beginTransaction();
        try {
            $stmtDel = $this->pdo->prepare('DELETE FROM activity_images WHERE id = :id');
            $stmtDel->execute(['id' => $imageId]);

            if ($wasCover) {
                // Find next image by display_order
                $stmtNext = $this->pdo->prepare('
                    SELECT id, image_url, alt_text 
                    FROM activity_images 
                    WHERE activity_id = :act_id 
                    ORDER BY display_order ASC, id ASC 
                    LIMIT 1
                ');
                $stmtNext->execute(['act_id' => $activityId]);
                $nextImg = $stmtNext->fetch();
                if ($nextImg) {
                    $stmtSetCover = $this->pdo->prepare('UPDATE activity_images SET is_cover = 1 WHERE id = :id');
                    $stmtSetCover->execute(['id' => $nextImg['id']]);

                    $stmtUpdateAct = $this->pdo->prepare('UPDATE activities SET image_url = :img, alt_text = :alt, updated_at = NOW() WHERE id = :act_id');
                    $stmtUpdateAct->execute(['img' => $nextImg['image_url'], 'alt' => $nextImg['alt_text'], 'act_id' => $activityId]);
                }
            }

            $this->pdo->commit();
            jsonSuccess(null, 'Imagen eliminada correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al eliminar la imagen.', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * PUT /api/activities/:id/images/:imageId/cover
     * Set image as cover.
     */
    public function setCoverImage(int $imageId): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT * FROM activity_images WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $imageId]);
        $image = $stmt->fetch();
        if (!$image) {
            jsonError('Imagen no encontrada.', 404);
        }

        $activityId = $image['activity_id'];

        $this->pdo->beginTransaction();
        try {
            $stmtUnset = $this->pdo->prepare('UPDATE activity_images SET is_cover = 0 WHERE activity_id = :act_id');
            $stmtUnset->execute(['act_id' => $activityId]);

            $stmtSet = $this->pdo->prepare('UPDATE activity_images SET is_cover = 1 WHERE id = :id');
            $stmtSet->execute(['id' => $imageId]);

            $stmtUpdateAct = $this->pdo->prepare('UPDATE activities SET image_url = :img, alt_text = :alt, updated_at = NOW() WHERE id = :act_id');
            $stmtUpdateAct->execute(['img' => $image['image_url'], 'alt' => $image['alt_text'], 'act_id' => $activityId]);

            $this->pdo->commit();
            jsonSuccess(null, 'Portada actualizada correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al actualizar la portada.', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * PUT /api/activities/:id/images
     * Reorder images batch.
     */
    public function reorderImages(string $activityId): void {
        requireAuth($this->pdo);

        $body = getRequestBody();
        $items = $body['items'] ?? $body;
        if (!is_array($items)) {
            jsonError('Formato inválido para reordenamiento. Se esperaba un array.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE activity_images SET display_order = :order WHERE id = :id AND activity_id = :act_id');
            foreach ($items as $idx => $item) {
                $id = (int)($item['id'] ?? 0);
                $order = isset($item['display_order']) ? (int)$item['display_order'] : $idx;
                if ($id > 0) {
                    $stmt->execute([
                        'order'  => $order,
                        'id'     => $id,
                        'act_id' => $activityId,
                    ]);
                }
            }
            $this->pdo->commit();
            jsonSuccess(null, 'Imágenes reordenadas correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al reordenar las imágenes.', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Helper to resolve local/relative image path to absolute URL for external APIs
     */
    public function resolvePublicImageUrl(?string $imageUrl): ?string {
        if (empty($imageUrl)) {
            return null;
        }
        if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            return $imageUrl;
        }

        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');
        if (str_starts_with($imageUrl, '/api/uploads/')) {
            $filename = basename($imageUrl);
            return 'https://i-wildland.com/api/uploads/' . $filename;
        }
        return 'https://i-wildland.com/' . ltrim($imageUrl, '/');
    }
}
