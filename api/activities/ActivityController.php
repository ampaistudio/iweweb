<?php
/**
 * iWE Dashboard API - Activity Controller (Domain: Tourism Activities)
 * 
 * Manages tourism activities and highlights.
 * Strict type validation against the closed enum used by the public site.
 */

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
     * List all activities (public shows published only; auth shows all or filtered)
     */
    public function list(): void {
        $user = getAuthenticatedUser($this->pdo);

        $params = [];
        $where = [];

        if (!$user) {
            $where[] = 'published = 1';
        } elseif (isset($_GET['published'])) {
            $where[] = 'published = :published';
            $params['published'] = (int)$_GET['published'];
        }

        if (!empty($_GET['type'])) {
            $where[] = 'type = :type';
            $params['type'] = $_GET['type'];
        }

        $sql = 'SELECT * FROM activities';
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY display_order ASC, created_at ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $activities = $stmt->fetchAll();

        // Fetch all highlights in one batch query
        $activityIds = array_column($activities, 'id');
        $highlightsByActivity = [];

        if (!empty($activityIds)) {
            $placeholders = implode(',', array_fill(0, count($activityIds), '?'));
            $stmtH = $this->pdo->prepare("
                SELECT activity_id, highlight_text, display_order 
                FROM activity_highlights 
                WHERE activity_id IN ({$placeholders})
                ORDER BY display_order ASC, id ASC
            ");
            $stmtH->execute($activityIds);
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
     */
    public function get(string $id): void {
        $user = getAuthenticatedUser($this->pdo);

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

        $stmtH = $this->pdo->prepare('SELECT highlight_text FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
        $stmtH->execute(['id' => $id]);
        $highlights = $stmtH->fetchAll(PDO::FETCH_COLUMN);

        jsonSuccess($this->formatActivityResponse($activity, $highlights));
    }

    /**
     * POST /api/activities
     * Create a new activity (requires authentication)
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

            // Insert highlights
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
                    }
                }
            }

            $this->pdo->commit();

            jsonSuccess([
                'id' => $id,
                'title' => trim($body['title'])
            ], 'Actividad creada exitosamente.', 201);

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al guardar la actividad: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/activities/:id
     * Update an activity and its highlights (requires authentication)
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

            // Replace highlights if provided
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
                    }
                }
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
     * Delete an activity and its cascade highlights (requires authentication)
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
