<?php
/**
 * iWE Dashboard API - Activity Controller (Domain: Tourism Activities)
 * 
 * Manages tourism activities, highlights, and multi-language translations (ES, CA, EN, FR).
 * Strict type validation against the closed enum used by the public site.
 */

declare(strict_types=1);

class ActivityController {
    private PDO $pdo;
    private array $config;

    public const ALLOWED_TYPES = [
        'BTT',
        '4x4',
        'Vía Ferrata',
        'Senderismo',
        'Esquí-Snow',
        'Rafting',
        'Heliflight'
    ];

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];

    private MetaGraphService $metaService;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        require_once __DIR__ . '/../core/social/MetaGraphService.php';
        $this->metaService = new MetaGraphService($pdo, $config);
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

        // Fetch highlights for these activities
        $activityIds = array_column($activities, 'id');
        $highlightsByActivity = [];

        if (!empty($activityIds)) {
            $placeholders = implode(',', array_fill(0, count($activityIds), '?'));
            if ($locale !== 'es') {
                $stmtH = $this->pdo->prepare("
                    SELECT 
                        h.activity_id,
                        COALESCE(NULLIF(ht.highlight_text, ''), h.highlight_text) AS highlight_text,
                        h.display_order 
                    FROM activity_highlights h
                    LEFT JOIN activity_highlight_translations ht ON ht.highlight_id = h.id AND ht.locale = ?
                    WHERE h.activity_id IN ({$placeholders})
                    ORDER BY h.display_order ASC, h.id ASC
                ");
                $stmtH->execute(array_merge([$locale], $activityIds));
            } else {
                $stmtH = $this->pdo->prepare("
                    SELECT activity_id, highlight_text, display_order 
                    FROM activity_highlights 
                    WHERE activity_id IN ({$placeholders})
                    ORDER BY display_order ASC, id ASC
                ");
                $stmtH->execute($activityIds);
            }

            while ($h = $stmtH->fetch()) {
                $highlightsByActivity[$h['activity_id']][] = $h['highlight_text'];
            }
        }

        $formatted = array_map(function ($act) use ($highlightsByActivity) {
            return $this->formatActivityResponse($act, $highlightsByActivity[$act['id']] ?? []);
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

        // Fetch base highlights
        $stmtH = $this->pdo->prepare('SELECT id, highlight_text, display_order FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
        $stmtH->execute(['id' => $id]);
        $baseHighlightsRows = $stmtH->fetchAll();
        $baseHighlights = array_column($baseHighlightsRows, 'highlight_text');

        // Fetch translations for all locales (CA, EN, FR)
        $translations = [
            'ca' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
            'en' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
            'fr' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, title, description, intro_title, intro_text, region, country, level, duration, alt_text FROM activity_translations WHERE activity_id = :id');
        $stmtT->execute(['id' => $id]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['title'] = $t['title'] ?? '';
                $translations[$loc]['description'] = $t['description'] ?? '';
                $translations[$loc]['intro_title'] = $t['intro_title'] ?? '';
                $translations[$loc]['intro_text'] = $t['intro_text'] ?? '';
                $translations[$loc]['region'] = $t['region'] ?? '';
                $translations[$loc]['country'] = $t['country'] ?? '';
                $translations[$loc]['level'] = $t['level'] ?? '';
                $translations[$loc]['duration'] = $t['duration'] ?? '';
                $translations[$loc]['alt_text'] = $t['alt_text'] ?? '';
            }
        }

        // Fetch highlight translations
        if (!empty($baseHighlightsRows)) {
            $highlightIds = array_column($baseHighlightsRows, 'id');
            $placeholders = implode(',', array_fill(0, count($highlightIds), '?'));
            $stmtHT = $this->pdo->prepare("
                SELECT highlight_id, locale, highlight_text 
                FROM activity_highlight_translations 
                WHERE highlight_id IN ({$placeholders})
            ");
            $stmtHT->execute($highlightIds);

            // Map highlight_id to index
            $idToIndex = [];
            foreach ($baseHighlightsRows as $idx => $r) {
                $idToIndex[$r['id']] = $idx;
            }

            // Initialize empty arrays with proper length
            foreach (['ca', 'en', 'fr'] as $loc) {
                $translations[$loc]['highlights'] = array_fill(0, count($baseHighlightsRows), '');
            }

            while ($ht = $stmtHT->fetch()) {
                $loc = $ht['locale'];
                $hId = $ht['highlight_id'];
                if (isset($translations[$loc], $idToIndex[$hId])) {
                    $translations[$loc]['highlights'][$idToIndex[$hId]] = $ht['highlight_text'];
                }
            }
        }

        // If specific non-ES locale was requested for public view:
        $displayTitle = $activity['title'];
        $displayDescription = $activity['description'];
        $displayIntroTitle = $activity['intro_title'] ?? null;
        $displayIntroText = $activity['intro_text'] ?? null;
        $displayRegion = $activity['region'];
        $displayCountry = $activity['country'];
        $displayLevel = $activity['level'];
        $displayDuration = $activity['duration'];
        $displayAltText = $activity['alt_text'];
        $displayHighlights = $baseHighlights;

        if ($locale !== 'es' && isset($translations[$locale])) {
            if (!empty($translations[$locale]['title'])) {
                $displayTitle = $translations[$locale]['title'];
            }
            if (!empty($translations[$locale]['description'])) {
                $displayDescription = $translations[$locale]['description'];
            }
            if (!empty($translations[$locale]['intro_title'])) {
                $displayIntroTitle = $translations[$locale]['intro_title'];
            }
            if (!empty($translations[$locale]['intro_text'])) {
                $displayIntroText = $translations[$locale]['intro_text'];
            }
            if (!empty($translations[$locale]['region'])) {
                $displayRegion = $translations[$locale]['region'];
            }
            if (!empty($translations[$locale]['country'])) {
                $displayCountry = $translations[$locale]['country'];
            }
            if (!empty($translations[$locale]['level'])) {
                $displayLevel = $translations[$locale]['level'];
            }
            if (!empty($translations[$locale]['duration'])) {
                $displayDuration = $translations[$locale]['duration'];
            }
            if (!empty($translations[$locale]['alt_text'])) {
                $displayAltText = $translations[$locale]['alt_text'];
            }
            if (!empty($translations[$locale]['highlights'])) {
                $displayHighlights = array_map(function ($idx, $baseH) use ($translations, $locale) {
                    $translated = $translations[$locale]['highlights'][$idx] ?? '';
                    return !empty($translated) ? $translated : $baseH;
                }, array_keys($baseHighlights), $baseHighlights);
            }
        }

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

        $formatted = $this->formatActivityResponse([
            ...$activity,
            'title'       => $displayTitle,
            'description' => $displayDescription,
            'intro_title' => $displayIntroTitle,
            'intro_text'  => $displayIntroText,
            'region'      => $displayRegion,
            'country'     => $displayCountry,
            'level'       => $displayLevel,
            'duration'    => $displayDuration,
            'alt_text'    => $displayAltText,
            'alt'         => $displayAltText,
        ], $displayHighlights);

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

        $errors = $this->validateActivityData($body, true);
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

            // Insert base highlights
            $insertedHighlightIds = [];
            $highlights = $body['highlights'] ?? [];
            if (is_array($highlights)) {
                $stmtH = $this->pdo->prepare('
                    INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
                    VALUES (:activity_id, :highlight_text, :display_order)
                ');
                foreach ($highlights as $order => $text) {
                    $text = trim((string)$text);
                    if ($text !== '') {
                        $stmtH->execute([
                            'activity_id'    => $id,
                            'highlight_text' => $text,
                            'display_order'  => $order + 1,
                        ]);
                        $insertedHighlightIds[] = (int)$this->pdo->lastInsertId();
                    }
                }
            }

            // Save multi-language translations (CA, EN, FR)
            $this->saveTranslations($id, $insertedHighlightIds, $body['translations'] ?? []);

            $this->pdo->commit();

            // Social dispatch if requested
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $socialResults = [];

            if ($publishFb || $publishIg) {
                $imageUrl = $this->resolvePublicImageUrl(trim($body['image'] ?? $body['image_url'] ?? ''));
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
        $errors = $this->validateActivityData($body, false);
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

            // Keep activity_images.is_cover in sync with the main photo chosen in the form.
            // If the new image_url matches an existing gallery entry, mark it as cover and
            // unmark the rest; if it doesn't match any gallery entry (external URL or one
            // typed by hand), leave the gallery untouched — we never invent a gallery row
            // for a photo the user did not explicitly add to the gallery.
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

            // Replace base highlights
            $newHighlightIds = [];
            if (isset($body['highlights']) && is_array($body['highlights'])) {
                $stmtDel = $this->pdo->prepare('DELETE FROM activity_highlights WHERE activity_id = :id');
                $stmtDel->execute(['id' => $id]);

                $stmtH = $this->pdo->prepare('
                    INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
                    VALUES (:activity_id, :highlight_text, :display_order)
                ');
                foreach ($body['highlights'] as $order => $text) {
                    $text = trim((string)$text);
                    if ($text !== '') {
                        $stmtH->execute([
                            'activity_id'    => $id,
                            'highlight_text' => $text,
                            'display_order'  => $order + 1,
                        ]);
                        $newHighlightIds[] = (int)$this->pdo->lastInsertId();
                    }
                }
            } else {
                $stmtExistingH = $this->pdo->prepare('SELECT id FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
                $stmtExistingH->execute(['id' => $id]);
                $newHighlightIds = $stmtExistingH->fetchAll(PDO::FETCH_COLUMN);
            }

            // Save multi-language translations (CA, EN, FR)
            if (isset($body['translations']) && is_array($body['translations'])) {
                $this->saveTranslations($id, $newHighlightIds, $body['translations']);
            }

            $this->pdo->commit();

            // Social dispatch if requested
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $socialResults = [];

            if ($publishFb || $publishIg) {
                $imageUrl = $this->resolvePublicImageUrl($newImageUrl);
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
     * POST /api/activities/:id/social-share
     * Manually share an existing activity to Facebook/Instagram
     */
    public function shareSocial(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id, title, description, intro_text, image_url, published FROM activities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $activity = $stmt->fetch();
        if (!$activity) {
            jsonError('Actividad no encontrada.', 404);
        }

        $body = getRequestBody();
        $publishFb = !empty($body['publish_to_facebook']);
        $publishIg = !empty($body['publish_to_instagram']);

        if (!$publishFb && !$publishIg) {
            jsonError('Debe seleccionar al menos una plataforma (Facebook o Instagram).', 422);
        }

        $imageUrl = $this->resolvePublicImageUrl((string)$activity['image_url']);
        $results = $this->metaService->publishActivity(
            $id,
            (string)$activity['title'],
            (string)($activity['intro_text'] ?: $activity['description']),
            $imageUrl,
            $publishFb,
            $publishIg
        );

        jsonSuccess([
            'activity_id' => $id,
            'social_sync' => $results,
        ], 'Sincronización social ejecutada.');
    }

    /**
     * Helper to resolve local/relative image path to absolute URL for external APIs
     */
    private function resolvePublicImageUrl(?string $imageUrl): ?string {
        if (empty($imageUrl)) {
            return null;
        }
        if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            return $imageUrl;
        }

        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');
        // If image_url starts with /api/uploads or uploads/
        if (str_starts_with($imageUrl, '/api/uploads/')) {
            $filename = basename($imageUrl);
            return 'https://i-wildland.com/api/uploads/' . $filename;
        }
        return 'https://i-wildland.com/' . ltrim($imageUrl, '/');
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

    /**
     * POST /api/activities/:id/duplicate
     * Duplicates an activity and all its content (highlights, translations, gallery)
     * into a new activity with a fresh id, so the user can then only tweak the
     * fields that differ (e.g. price/duration variants of the same experience).
     * The duplicate is created unpublished, so it never appears on the public
     * site before the user reviews and adjusts it.
     */
    public function duplicate(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT * FROM activities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $source = $stmt->fetch();
        if (!$source) {
            jsonError('Actividad no encontrada.', 404);
        }

        $newId = $this->generateUniqueDuplicateId($source['id']);
        $newTitle = $source['title'] . ' (copia)';

        $this->pdo->beginTransaction();
        try {
            $stmtInsertAct = $this->pdo->prepare('
                INSERT INTO activities (
                    id, title, region, country, type, level, duration,
                    image_url, alt_text, price, description, intro_title, intro_text,
                    display_order, published, created_at, updated_at
                ) VALUES (
                    :id, :title, :region, :country, :type, :level, :duration,
                    :image_url, :alt_text, :price, :description, :intro_title, :intro_text,
                    :display_order, 0, NOW(), NOW()
                )
            ');
            $stmtInsertAct->execute([
                'id'            => $newId,
                'title'         => $newTitle,
                'region'        => $source['region'],
                'country'       => $source['country'],
                'type'          => $source['type'],
                'level'         => $source['level'],
                'duration'      => $source['duration'],
                'image_url'     => $source['image_url'],
                'alt_text'      => $source['alt_text'],
                'price'         => $source['price'],
                'description'   => $source['description'],
                'intro_title'   => $source['intro_title'] ?? null,
                'intro_text'    => $source['intro_text'] ?? null,
                'display_order' => (int)$source['display_order'],
            ]);

            // Copy highlights, keeping a map from old highlight id to new one
            // so we can copy their per-locale translations too.
            $stmtSrcHighlights = $this->pdo->prepare('SELECT id, highlight_text, display_order FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
            $stmtSrcHighlights->execute(['id' => $id]);
            $sourceHighlights = $stmtSrcHighlights->fetchAll();

            $highlightIdMap = [];
            $stmtInsertHighlight = $this->pdo->prepare('
                INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
                VALUES (:activity_id, :highlight_text, :display_order)
            ');
            foreach ($sourceHighlights as $h) {
                $stmtInsertHighlight->execute([
                    'activity_id'    => $newId,
                    'highlight_text' => $h['highlight_text'],
                    'display_order'  => $h['display_order'],
                ]);
                $highlightIdMap[$h['id']] = (int)$this->pdo->lastInsertId();
            }

            // Copy base (ES) activity translation row equivalent: activity_translations (CA/EN/FR)
            $stmtSrcTrans = $this->pdo->prepare('SELECT * FROM activity_translations WHERE activity_id = :id');
            $stmtSrcTrans->execute(['id' => $id]);
            $stmtInsertTrans = $this->pdo->prepare('
                INSERT INTO activity_translations (activity_id, locale, title, description, intro_title, intro_text, created_at, updated_at)
                VALUES (:activity_id, :locale, :title, :description, :intro_title, :intro_text, NOW(), NOW())
            ');
            while ($t = $stmtSrcTrans->fetch()) {
                $stmtInsertTrans->execute([
                    'activity_id' => $newId,
                    'locale'      => $t['locale'],
                    'title'       => $t['title'] . ' (copia)',
                    'description' => $t['description'],
                    'intro_title' => $t['intro_title'] ?? null,
                    'intro_text'  => $t['intro_text'] ?? null,
                ]);
            }

            // Copy highlight translations, remapped to the new highlight ids
            if (!empty($highlightIdMap)) {
                $placeholders = implode(',', array_fill(0, count($highlightIdMap), '?'));
                $stmtSrcHT = $this->pdo->prepare("SELECT highlight_id, locale, highlight_text FROM activity_highlight_translations WHERE highlight_id IN ({$placeholders})");
                $stmtSrcHT->execute(array_keys($highlightIdMap));
                $stmtInsertHT = $this->pdo->prepare('
                    INSERT INTO activity_highlight_translations (highlight_id, locale, highlight_text, created_at, updated_at)
                    VALUES (:highlight_id, :locale, :highlight_text, NOW(), NOW())
                ');
                while ($ht = $stmtSrcHT->fetch()) {
                    $stmtInsertHT->execute([
                        'highlight_id'   => $highlightIdMap[$ht['highlight_id']],
                        'locale'         => $ht['locale'],
                        'highlight_text' => $ht['highlight_text'],
                    ]);
                }
            }

            // Copy gallery images (photos and videos)
            $stmtSrcImages = $this->pdo->prepare('SELECT * FROM activity_images WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
            $stmtSrcImages->execute(['id' => $id]);
            $stmtInsertImage = $this->pdo->prepare('
                INSERT INTO activity_images (activity_id, image_url, media_type, poster_url, alt_text, display_order, is_cover, created_at)
                VALUES (:activity_id, :image_url, :media_type, :poster_url, :alt_text, :display_order, :is_cover, NOW())
            ');
            while ($img = $stmtSrcImages->fetch()) {
                $stmtInsertImage->execute([
                    'activity_id'   => $newId,
                    'image_url'     => $img['image_url'],
                    'media_type'    => $img['media_type'] ?? 'image',
                    'poster_url'    => $img['poster_url'] ?? null,
                    'alt_text'      => $img['alt_text'],
                    'display_order' => (int)$img['display_order'],
                    'is_cover'      => (int)$img['is_cover'],
                ]);
            }

            $this->pdo->commit();

            jsonSuccess(['id' => $newId, 'title' => $newTitle], 'Actividad duplicada correctamente.', 201);
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al duplicar la actividad: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generates a unique activity id derived from the source id (e.g. "heliflight-copia",
     * "heliflight-copia-2") so duplicating the same activity multiple times never collides.
     */
    private function generateUniqueDuplicateId(string $sourceId): string {
        $base = $sourceId . '-copia';
        $candidate = $base;
        $suffix = 2;

        $stmt = $this->pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        while (true) {
            $stmt->execute(['id' => $candidate]);
            if (!$stmt->fetch()) {
                return $candidate;
            }
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }
    }

    /**
     * Save translations into activity_translations and activity_highlight_translations
     */
    private function saveTranslations(string $activityId, array $highlightIds, array $translations): void {
        foreach (['ca', 'en', 'fr'] as $loc) {
            if (!isset($translations[$loc]) || !is_array($translations[$loc])) {
                continue;
            }

            $tTitle = trim((string)($translations[$loc]['title'] ?? ''));
            $tDesc = sanitizeRichText((string)($translations[$loc]['description'] ?? ''));
            $tIntroTitle = trim((string)($translations[$loc]['intro_title'] ?? ''));
            $tIntroText = sanitizeRichText((string)($translations[$loc]['intro_text'] ?? ''));
            $tRegion = trim((string)($translations[$loc]['region'] ?? ''));
            $tCountry = trim((string)($translations[$loc]['country'] ?? ''));
            $tLevel = trim((string)($translations[$loc]['level'] ?? ''));
            $tDuration = trim((string)($translations[$loc]['duration'] ?? ''));
            $tAltText = trim((string)($translations[$loc]['alt_text'] ?? ''));

            if ($tTitle !== '' || $tDesc !== '' || $tIntroTitle !== '' || $tIntroText !== '' || $tRegion !== '' || $tCountry !== '' || $tLevel !== '' || $tDuration !== '' || $tAltText !== '') {
                $stmt = $this->pdo->prepare('
                    INSERT INTO activity_translations (activity_id, locale, title, description, intro_title, intro_text, region, country, level, duration, alt_text, created_at, updated_at)
                    VALUES (:activity_id, :locale, :title, :description, :intro_title, :intro_text, :region, :country, :level, :duration, :alt_text, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        description = VALUES(description),
                        intro_title = VALUES(intro_title),
                        intro_text = VALUES(intro_text),
                        region = VALUES(region),
                        country = VALUES(country),
                        level = VALUES(level),
                        duration = VALUES(duration),
                        alt_text = VALUES(alt_text),
                        updated_at = NOW()
                ');
                $stmt->execute([
                    'activity_id' => $activityId,
                    'locale'      => $loc,
                    'title'       => $tTitle,
                    'description' => $tDesc,
                    'intro_title' => $tIntroTitle !== '' ? $tIntroTitle : null,
                    'intro_text'  => $tIntroText !== '' ? $tIntroText : null,
                    'region'      => $tRegion !== '' ? $tRegion : null,
                    'country'     => $tCountry !== '' ? $tCountry : null,
                    'level'       => $tLevel !== '' ? $tLevel : null,
                    'duration'    => $tDuration !== '' ? $tDuration : null,
                    'alt_text'    => $tAltText !== '' ? $tAltText : null,
                ]);
            } else {
                $stmt = $this->pdo->prepare('DELETE FROM activity_translations WHERE activity_id = :activity_id AND locale = :locale');
                $stmt->execute(['activity_id' => $activityId, 'locale' => $loc]);
            }

            // Save highlight translations
            $tHighlights = $translations[$loc]['highlights'] ?? [];
            if (is_array($tHighlights)) {
                foreach ($highlightIds as $index => $hId) {
                    $tText = trim((string)($tHighlights[$index] ?? ''));
                    if ($tText !== '') {
                        $stmtHT = $this->pdo->prepare('
                            INSERT INTO activity_highlight_translations (highlight_id, locale, highlight_text, created_at, updated_at)
                            VALUES (:highlight_id, :locale, :highlight_text, NOW(), NOW())
                            ON DUPLICATE KEY UPDATE 
                                highlight_text = VALUES(highlight_text), 
                                updated_at = NOW()
                        ');
                        $stmtHT->execute([
                            'highlight_id'   => $hId,
                            'locale'         => $loc,
                            'highlight_text' => $tText,
                        ]);
                    } else {
                        $stmtHT = $this->pdo->prepare('DELETE FROM activity_highlight_translations WHERE highlight_id = :highlight_id AND locale = :locale');
                        $stmtHT->execute(['highlight_id' => $hId, 'locale' => $loc]);
                    }
                }
            }
        }
    }

    /**
     * Server-side validation of activity fields
     */
    private function validateActivityData(array $data, bool $isCreate): array {
        $errors = [];

        $required = ['title', 'region', 'country', 'type', 'level', 'duration', 'description'];
        foreach ($required as $field) {
            if (empty(trim((string)($data[$field] ?? '')))) {
                $errors[$field] = "El campo '{$field}' es obligatorio.";
            }
        }

        $image = $data['image'] ?? $data['image_url'] ?? '';
        if (empty(trim((string)$image))) {
            $errors['image'] = "La URL de imagen o archivo media es obligatoria.";
        }

        $alt = $data['alt'] ?? $data['alt_text'] ?? '';
        if (empty(trim((string)$alt))) {
            $errors['alt'] = "El texto alternativo (alt) es obligatorio para accesibilidad.";
        }

        $type = $data['type'] ?? '';
        if (!in_array($type, self::ALLOWED_TYPES, true)) {
            $allowedStr = implode(', ', self::ALLOWED_TYPES);
            $errors['type'] = "Tipo de actividad inválido '{$type}'. Valores permitidos: {$allowedStr}";
        }

        if (isset($data['highlights']) && !is_array($data['highlights'])) {
            $errors['highlights'] = "El campo 'highlights' debe ser una lista de strings.";
        }

        return $errors;
    }

    /**
     * Format database row to 1:1 match TypeScript Activity type
     */
    private function formatActivityResponse(array $row, array $highlights): array {
        return [
            'id'            => $row['id'],
            'title'         => $row['title'],
            'region'        => $row['region'],
            'country'       => $row['country'],
            'type'          => $row['type'],
            'level'         => $row['level'],
            'duration'      => $row['duration'],
            'image'         => $row['image_url'],
            'image_url'     => $row['image_url'],
            'alt'           => $row['alt_text'],
            'alt_text'      => $row['alt_text'],
            'price'         => $row['price'] ?: null,
            'description'   => $row['description'],
            'intro_title'   => $row['intro_title'] ?? null,
            'intro_text'    => $row['intro_text'] ?? null,
            'highlights'    => $highlights,
            'display_order' => (int)$row['display_order'],
            'published'     => (bool)$row['published'],
            'created_at'    => $row['created_at'],
            'updated_at'    => $row['updated_at'],
        ];
    }

    /**
     * POST /api/activities/:id/images
     * Add a new image to activity gallery.
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
}
