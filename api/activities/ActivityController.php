<?php
/**
 * iWE Dashboard API - Activity Controller (Domain: Tourism Activities)
 * 
 * Manages core CRUD operations for tourism activities.
 * Strict type validation against the closed enum used by the public site.
 */

declare(strict_types=1);

require_once __DIR__ . '/ActivityTranslationService.php';
require_once __DIR__ . '/ActivityImageController.php';
require_once __DIR__ . '/ActivityHighlightService.php';
require_once __DIR__ . '/ActivityValidationService.php';

class ActivityController {
    private PDO $pdo;
    private array $config;

    public function getAllowedTypes(): array {
        $stmt = $this->pdo->query('SELECT name FROM activity_types ORDER BY display_order ASC');
        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];

    private MetaGraphService $metaService;
    private ActivityTranslationService $translationService;
    private ActivityImageController $imageController;
    private ActivityHighlightService $highlightService;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        require_once __DIR__ . '/../core/social/MetaGraphService.php';
        $this->metaService = new MetaGraphService($pdo, $config);
        $this->translationService = new ActivityTranslationService($pdo);
        $this->imageController = new ActivityImageController($pdo, $config);
        $this->highlightService = new ActivityHighlightService($pdo);
    }

    /**
     * Domain usage checker registered in MediaController.
     * Checks if a media filename is currently referenced by any activity.
     */
    public static function checkMediaUsage(array $media, PDO $pdo): ?string {
        $stmt = $pdo->prepare('SELECT id, title FROM activities WHERE image_url LIKE :pattern LIMIT 1');
        $stmt->execute(['pattern' => '%' . $media['filename'] . '%']);
        $activity = $stmt->fetch();
        if ($activity) {
            return "No se puede eliminar la imagen porque está en uso en la actividad '{$activity['title']}'.";
        }

        $stmt2 = $pdo->prepare('SELECT a.title FROM activity_images ai JOIN activities a ON a.id = ai.activity_id WHERE ai.image_url LIKE :pattern LIMIT 1');
        $stmt2->execute(['pattern' => '%' . $media['filename'] . '%']);
        $act2 = $stmt2->fetch();
        if ($act2) {
            return "No se puede eliminar la imagen porque está en uso en la galería de la actividad '{$act2['title']}'.";
        }

        return null;
    }

    /**
     * GET /api/activities
     * List all activities (public shows published only; auth shows all or filtered).
     * Query param: ?locale=es|ca|en|fr
     */
    public function list(): void {
        $user = getAuthenticatedUser($this->pdo);
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        $params = [];
        $where = [];

        if (!$user) {
            $where[] = 'a.published = 1';
        } elseif (isset($_GET['published'])) {
            $where[] = 'a.published = :published';
            $params['published'] = (int)$_GET['published'];
        }

        if (!empty($_GET['type'])) {
            $where[] = 'a.type = :type';
            $params['type'] = $_GET['type'];
        }

        if ($locale !== 'es') {
            $params['locale'] = $locale;
            $sql = '
                SELECT 
                    a.id, 
                    COALESCE(NULLIF(t.title, ""), a.title) AS title,
                    COALESCE(NULLIF(t.region, ""), a.region) AS region, 
                    COALESCE(NULLIF(t.country, ""), a.country) AS country, 
                    a.type, 
                    COALESCE(NULLIF(t.level, ""), a.level) AS level, 
                    COALESCE(NULLIF(t.duration, ""), a.duration) AS duration, 
                    a.image_url, 
                    COALESCE(NULLIF(t.alt_text, ""), a.alt_text) AS alt_text, 
                    a.price,
                    COALESCE(NULLIF(t.description, ""), a.description) AS description,
                    COALESCE(NULLIF(t.intro_title, ""), a.intro_title) AS intro_title,
                    COALESCE(NULLIF(t.intro_text, ""), a.intro_text) AS intro_text,
                    a.display_order,
                    a.published, 
                    a.created_at, 
                    a.updated_at
                FROM activities a
                LEFT JOIN activity_translations t ON t.activity_id = a.id AND t.locale = :locale
            ';
        } else {
            $sql = 'SELECT a.* FROM activities a';
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY a.display_order ASC, a.created_at ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $activities = $stmt->fetchAll();

        // Fetch highlights via HighlightService
        $activityIds = array_column($activities, 'id');
        $highlightsByActivity = $this->highlightService->getHighlightsForActivities($activityIds, $locale);

        $formatted = array_map(function ($act) use ($highlightsByActivity) {
            return ActivityValidationService::formatResponse($act, $highlightsByActivity[$act['id']] ?? []);
        }, $activities);

        jsonSuccess($formatted);
    }

    /**
     * GET /api/activities/:id
     * Returns activity details. Includes full translations dictionary for dashboard editing.
     */
    public function get(string $id): void {
        $user = getAuthenticatedUser($this->pdo);
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        $sql = 'SELECT * FROM activities WHERE id = :id';
        if (!$user) {
            $sql .= ' AND published = 1';
        }
        $sql .= ' LIMIT 1';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $activity = $stmt->fetch();

        if (!$activity) {
            jsonError('Actividad no encontrada.', 404);
        }

        // Fetch base highlights via HighlightService
        $baseHighlightsRows = $this->highlightService->getBaseHighlights($id);
        $baseHighlights = array_column($baseHighlightsRows, 'highlight_text');

        // Fetch translations for all locales (CA, EN, FR) via TranslationService
        $translations = $this->translationService->loadTranslations($id, $baseHighlightsRows);

        // Compute display values for non-ES locale
        $disp = $this->translationService->getDisplayValues($activity, $baseHighlights, $locale, $translations);

        // Fetch gallery images
        $stmtImg = $this->pdo->prepare('
            SELECT id, activity_id, image_url, media_type, poster_url, alt_text, display_order, is_cover 
            FROM activity_images 
            WHERE activity_id = :id 
            ORDER BY display_order ASC, id ASC
        ');
        $stmtImg->execute(['id' => $id]);
        $images = array_map(function ($img) {
            return [
                'id'            => (int)$img['id'],
                'activity_id'   => $img['activity_id'],
                'image_url'     => $img['image_url'],
                'media_type'    => $img['media_type'] ?? 'image',
                'poster_url'    => $img['poster_url'] ?? null,
                'alt_text'      => $img['alt_text'] ?? '',
                'display_order' => (int)$img['display_order'],
                'is_cover'      => (bool)$img['is_cover'],
            ];
        }, $stmtImg->fetchAll());

        $formatted = ActivityValidationService::formatResponse([
            ...$activity,
            'title'       => $disp['title'],
            'description' => $disp['description'],
            'intro_title' => $disp['intro_title'],
            'intro_text'  => $disp['intro_text'],
            'region'      => $disp['region'],
            'country'     => $disp['country'],
            'level'       => $disp['level'],
            'duration'    => $disp['duration'],
            'alt_text'    => $disp['alt_text'],
            'alt'         => $disp['alt_text'],
        ], $disp['highlights']);

        $formatted['translations'] = $translations;
        $formatted['images'] = $images;

        // Fetch social links
        $stmtSocial = $this->pdo->prepare('
            SELECT platform, external_post_id, external_permalink, sync_status, sync_error, synced_at 
            FROM activity_social_links 
            WHERE activity_id = :id
        ');
        $stmtSocial->execute(['id' => $id]);
        $formatted['social_links'] = $stmtSocial->fetchAll();

        jsonSuccess($formatted);
    }

    /**
     * POST /api/activities
     * Create a new activity and its translations (requires authentication)
     */
    public function create(): void {
        requireAuth($this->pdo);
        $body = getRequestBody();

        $errors = ActivityValidationService::validate($body, $this->getAllowedTypes());
        if (!empty($errors)) {
            jsonError('Datos de actividad inválidos.', 422, $errors);
        }

        $id = !empty($body['id']) ? slugify($body['id']) : slugify($body['title']);

        // Check uniqueness of ID
        $stmtCheck = $this->pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        $stmtCheck->execute(['id' => $id]);
        if ($stmtCheck->fetch()) {
            jsonError("Ya existe una actividad con el identificador '{$id}'.", 409);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO activities (
                    id, title, region, country, type, level, duration,
                    image_url, alt_text, price, description, intro_title, intro_text, display_order, published, created_at, updated_at
                ) VALUES (
                    :id, :title, :region, :country, :type, :level, :duration,
                    :image_url, :alt_text, :price, :description, :intro_title, :intro_text, :display_order, :published, NOW(), NOW()
                )
            ');

            $stmt->execute([
                'id'            => $id,
                'title'         => trim($body['title']),
                'region'        => trim($body['region']),
                'country'       => trim($body['country']),
                'type'          => trim($body['type']),
                'level'         => trim($body['level']),
                'duration'      => trim($body['duration']),
                'image_url'     => trim($body['image'] ?? $body['image_url'] ?? ''),
                'alt_text'      => trim($body['alt'] ?? $body['alt_text'] ?? ''),
                'price'         => !empty($body['price']) ? trim($body['price']) : null,
                'description'   => sanitizeRichText($body['description']),
                'intro_title'   => !empty($body['intro_title']) ? trim((string)$body['intro_title']) : null,
                'intro_text'    => !empty($body['intro_text']) ? sanitizeRichText((string)$body['intro_text']) : null,
                'display_order' => (int)($body['display_order'] ?? $body['order'] ?? 0),
                'published'     => isset($body['published']) ? ((bool)$body['published'] ? 1 : 0) : 1,
            ]);

            // Save base highlights via HighlightService
            $insertedHighlightIds = $this->highlightService->saveHighlights($id, $body['highlights'] ?? []);

            // Save multi-language translations (CA, EN, FR) via TranslationService
            $this->translationService->saveTranslations($id, $insertedHighlightIds, $body['translations'] ?? []);

            $this->pdo->commit();

            // Social dispatch if requested
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $socialResults = [];

            if ($publishFb || $publishIg) {
                $imageUrl = $this->imageController->resolvePublicImageUrl(trim($body['image'] ?? $body['image_url'] ?? ''));
                $socialResults = $this->metaService->publishActivity(
                    $id,
                    trim($body['title']),
                    (string)($body['intro_text'] ?? $body['description'] ?? ''),
                    $imageUrl,
                    $publishFb,
                    $publishIg
                );
            }

            jsonSuccess([
                'id'          => $id,
                'title'       => trim($body['title']),
                'social_sync' => $socialResults,
            ], 'Actividad creada exitosamente.', 201);

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al guardar la actividad: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/activities/:id
     * Update an activity, highlights, and translations (requires authentication)
     */
    public function update(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            jsonError('Actividad no encontrada.', 404);
        }

        $body = getRequestBody();
        $errors = ActivityValidationService::validate($body, $this->getAllowedTypes());
        if (!empty($errors)) {
            jsonError('Datos de actividad inválidos.', 422, $errors);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('
                UPDATE activities SET
                    title         = :title,
                    region        = :region,
                    country       = :country,
                    type          = :type,
                    level         = :level,
                    duration      = :duration,
                    image_url     = :image_url,
                    alt_text      = :alt_text,
                    price         = :price,
                    description   = :description,
                    intro_title   = :intro_title,
                    intro_text    = :intro_text,
                    display_order = :display_order,
                    published     = :published,
                    updated_at    = NOW()
                WHERE id = :id
            ');

            $newImageUrl = trim($body['image'] ?? $body['image_url'] ?? '');

            $stmt->execute([
                'id'            => $id,
                'title'         => trim($body['title']),
                'region'        => trim($body['region']),
                'country'       => trim($body['country']),
                'type'          => trim($body['type']),
                'level'         => trim($body['level']),
                'duration'      => trim($body['duration']),
                'image_url'     => $newImageUrl,
                'alt_text'      => trim($body['alt'] ?? $body['alt_text'] ?? ''),
                'price'         => !empty($body['price']) ? trim($body['price']) : null,
                'description'   => sanitizeRichText($body['description']),
                'intro_title'   => !empty($body['intro_title']) ? trim((string)$body['intro_title']) : null,
                'intro_text'    => !empty($body['intro_text']) ? sanitizeRichText((string)$body['intro_text']) : null,
                'display_order' => (int)($body['display_order'] ?? $body['order'] ?? 0),
                'published'     => isset($body['published']) ? ((bool)$body['published'] ? 1 : 0) : 1,
            ]);

            // Keep activity_images.is_cover in sync with main photo
            if ($newImageUrl !== '') {
                $stmtFindImg = $this->pdo->prepare('SELECT id FROM activity_images WHERE activity_id = :act_id AND image_url = :image_url LIMIT 1');
                $stmtFindImg->execute(['act_id' => $id, 'image_url' => $newImageUrl]);
                $matchingImage = $stmtFindImg->fetch();
                if ($matchingImage) {
                    $stmtUnsetCover = $this->pdo->prepare('UPDATE activity_images SET is_cover = 0 WHERE activity_id = :act_id');
                    $stmtUnsetCover->execute(['act_id' => $id]);
                    $stmtSetCover = $this->pdo->prepare('UPDATE activity_images SET is_cover = 1 WHERE id = :id');
                    $stmtSetCover->execute(['id' => $matchingImage['id']]);
                }
            }

            // Replace base highlights via HighlightService
            $newHighlightIds = [];
            if (isset($body['highlights']) && is_array($body['highlights'])) {
                $this->highlightService->deleteHighlights($id);
                $newHighlightIds = $this->highlightService->saveHighlights($id, $body['highlights']);
            } else {
                $baseRows = $this->highlightService->getBaseHighlights($id);
                $newHighlightIds = array_column($baseRows, 'id');
            }

            // Save multi-language translations (CA, EN, FR) via TranslationService
            if (isset($body['translations']) && is_array($body['translations'])) {
                $this->translationService->saveTranslations($id, $newHighlightIds, $body['translations']);
            }

            $this->pdo->commit();

            // Social dispatch if requested
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $socialResults = [];

            if ($publishFb || $publishIg) {
                $imageUrl = $this->imageController->resolvePublicImageUrl($newImageUrl);
                $socialResults = $this->metaService->publishActivity(
                    $id,
                    trim($body['title']),
                    (string)($body['intro_text'] ?? $body['description'] ?? ''),
                    $imageUrl,
                    $publishFb,
                    $publishIg
                );
            }

            jsonSuccess([
                'id'          => $id,
                'social_sync' => $socialResults,
            ], 'Actividad actualizada correctamente.');

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al actualizar la actividad: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/activities/:id
     * Delete an activity and its cascade highlights and translations (requires authentication)
     */
    public function delete(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            jsonError('Actividad no encontrada.', 404);
        }

        try {
            $stmtDel = $this->pdo->prepare('DELETE FROM activities WHERE id = :id');
            $stmtDel->execute(['id' => $id]);
        } catch (Throwable $e) {
            jsonError('Error al eliminar la actividad: ' . $e->getMessage(), 500);
        }

        jsonSuccess(null, 'Actividad eliminada correctamente.');
    }
}
