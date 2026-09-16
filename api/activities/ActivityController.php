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

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
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
                    a.region, 
                    a.country, 
                    a.type, 
                    a.level, 
                    a.duration, 
                    a.image_url, 
                    a.alt_text, 
                    a.price, 
                    COALESCE(NULLIF(t.description, ""), a.description) AS description,
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
            'ca' => ['title' => '', 'description' => '', 'highlights' => []],
            'en' => ['title' => '', 'description' => '', 'highlights' => []],
            'fr' => ['title' => '', 'description' => '', 'highlights' => []],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, title, description FROM activity_translations WHERE activity_id = :id');
        $stmtT->execute(['id' => $id]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['title'] = $t['title'];
                $translations[$loc]['description'] = $t['description'];
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
        $displayHighlights = $baseHighlights;

        if ($locale !== 'es' && isset($translations[$locale])) {
            if (!empty($translations[$locale]['title'])) {
                $displayTitle = $translations[$locale]['title'];
            }
            if (!empty($translations[$locale]['description'])) {
                $displayDescription = $translations[$locale]['description'];
            }
            if (!empty($translations[$locale]['highlights'])) {
                $displayHighlights = array_map(function ($idx, $baseH) use ($translations, $locale) {
                    $translated = $translations[$locale]['highlights'][$idx] ?? '';
                    return !empty($translated) ? $translated : $baseH;
                }, array_keys($baseHighlights), $baseHighlights);
            }
        }

        $formatted = $this->formatActivityResponse([
            ...$activity,
            'title'       => $displayTitle,
            'description' => $displayDescription,
        ], $displayHighlights);

        $formatted['translations'] = $translations;

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
                    image_url, alt_text, price, description, display_order, published, created_at, updated_at
                ) VALUES (
                    :id, :title, :region, :country, :type, :level, :duration,
                    :image_url, :alt_text, :price, :description, :display_order, :published, NOW(), NOW()
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
                'description'   => trim($body['description']),
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

            jsonSuccess([
                'id'    => $id,
                'title' => trim($body['title'])
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
                    display_order = :display_order,
                    published     = :published,
                    updated_at    = NOW()
                WHERE id = :id
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
                'description'   => trim($body['description']),
                'display_order' => (int)($body['display_order'] ?? $body['order'] ?? 0),
                'published'     => isset($body['published']) ? ((bool)$body['published'] ? 1 : 0) : 1,
            ]);

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

            jsonSuccess(['id' => $id], 'Actividad actualizada correctamente.');

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

        $stmtDel = $this->pdo->prepare('DELETE FROM activities WHERE id = :id');
        $stmtDel->execute(['id' => $id]);

        jsonSuccess(null, 'Actividad eliminada correctamente.');
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
            $tDesc = trim((string)($translations[$loc]['description'] ?? ''));

            if ($tTitle !== '' || $tDesc !== '') {
                $stmt = $this->pdo->prepare('
                    INSERT INTO activity_translations (activity_id, locale, title, description, created_at, updated_at)
                    VALUES (:activity_id, :locale, :title, :description, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                        title = VALUES(title), 
                        description = VALUES(description), 
                        updated_at = NOW()
                ');
                $stmt->execute([
                    'activity_id' => $activityId,
                    'locale'      => $loc,
                    'title'       => $tTitle,
                    'description' => $tDesc,
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
            'highlights'    => $highlights,
            'display_order' => (int)$row['display_order'],
            'published'     => (bool)$row['published'],
            'created_at'    => $row['created_at'],
            'updated_at'    => $row['updated_at'],
        ];
    }
}
