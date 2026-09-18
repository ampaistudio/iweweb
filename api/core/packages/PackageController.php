<?php
/**
 * iWE Dashboard API - Package Controller (Domain: Multi-day Packages)
 * 
 * Manages multi-day tour packages (e.g. "Andorra Holiday & Bike"),
 * structured pricing (amount, currency, unit), schedule rules, and translations.
 */

declare(strict_types=1);

class PackageController {
    private PDO $pdo;
    private array $config;

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/packages
     * List all packages (public shows published & active schedule; auth shows all).
     */
    public function list(): void {
        $user = getAuthenticatedUser($this->pdo);
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        $includeUnpublished = $user && !empty($_GET['includeUnpublished']);

        $params = [];
        $where = [];

        if (!$includeUnpublished) {
            $where[] = 'p.published = 1';
            $where[] = '(p.publish_at IS NULL OR p.publish_at <= NOW())';
            $where[] = '(p.unpublish_at IS NULL OR p.unpublish_at > NOW())';
        }

        if ($locale !== 'es') {
            $params['locale'] = $locale;
            $sql = '
                SELECT 
                    p.id,
                    COALESCE(NULLIF(t.title, ""), p.title) AS title,
                    p.duration,
                    COALESCE(NULLIF(t.description, ""), p.description) AS description,
                    p.image_url,
                    p.alt_text,
                    p.price_amount,
                    p.price_currency,
                    COALESCE(NULLIF(t.price_unit, ""), p.price_unit) AS price_unit,
                    p.display_order,
                    p.published,
                    p.publish_at,
                    p.unpublish_at,
                    p.created_at,
                    p.updated_at,
                    (
                        p.published = 1 
                        AND (p.publish_at IS NULL OR p.publish_at <= NOW()) 
                        AND (p.unpublish_at IS NULL OR p.unpublish_at > NOW())
                    ) AS is_currently_visible
                FROM packages p
                LEFT JOIN package_translations t ON t.package_id = p.id AND t.locale = :locale
            ';
        } else {
            $sql = '
                SELECT 
                    p.*,
                    (
                        p.published = 1 
                        AND (p.publish_at IS NULL OR p.publish_at <= NOW()) 
                        AND (p.unpublish_at IS NULL OR p.unpublish_at > NOW())
                    ) AS is_currently_visible
                FROM packages p
            ';
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY p.display_order ASC, p.id ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $formatted = array_map(function ($pkg) {
            return $this->formatPackageResponse($pkg);
        }, $rows);

        jsonSuccess($formatted);
    }

    /**
     * GET /api/packages/:id
     * Returns package details with full translations dictionary for dashboard editing.
     */
    public function get(string $id): void {
        $user = getAuthenticatedUser($this->pdo);

        $sql = '
            SELECT 
                p.*,
                (
                    p.published = 1 
                    AND (p.publish_at IS NULL OR p.publish_at <= NOW()) 
                    AND (p.unpublish_at IS NULL OR p.unpublish_at > NOW())
                ) AS is_currently_visible
            FROM packages p 
            WHERE p.id = :id 
            LIMIT 1
        ';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $pkg = $stmt->fetch();

        if (!$pkg) {
            jsonError('Paquete no encontrado.', 404);
        }

        if (!$user && !$pkg['is_currently_visible']) {
            jsonError('Paquete no disponible.', 404);
        }

        // Fetch translations for dashboard editing
        $translations = [
            'ca' => ['title' => '', 'description' => '', 'price_unit' => ''],
            'en' => ['title' => '', 'description' => '', 'price_unit' => ''],
            'fr' => ['title' => '', 'description' => '', 'price_unit' => ''],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, title, description, price_unit FROM package_translations WHERE package_id = :id');
        $stmtT->execute(['id' => $id]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['title'] = $t['title'];
                $translations[$loc]['description'] = $t['description'];
                $translations[$loc]['price_unit'] = $t['price_unit'] ?? '';
            }
        }

        $res = $this->formatPackageResponse($pkg);
        if ($user) {
            $res['translations'] = $translations;
        }

        jsonSuccess($res);
    }

    /**
     * POST /api/packages
     */
    public function create(): void {
        requireAuth($this->pdo);
        $data = getJsonInput();

        $errors = $this->validatePackageData($data, true);
        if (!empty($errors)) {
            jsonError('Datos de paquete no válidos.', 422, $errors);
        }

        $id = trim((string)$data['id']);

        $stmtCheck = $this->pdo->prepare('SELECT id FROM packages WHERE id = :id');
        $stmtCheck->execute(['id' => $id]);
        if ($stmtCheck->fetch()) {
            jsonError("Ya existe un paquete con el ID '{$id}'.", 409, ['id' => 'ID duplicado']);
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO packages (
                id, title, duration, description, image_url, alt_text, 
                price_amount, price_currency, price_unit, display_order, 
                published, publish_at, unpublish_at, created_at, updated_at
            ) VALUES (
                :id, :title, :duration, :description, :image_url, :alt_text,
                :price_amount, :price_currency, :price_unit, :display_order,
                :published, :publish_at, :unpublish_at, NOW(), NOW()
            )
        ');

        $stmt->execute([
            'id'             => $id,
            'title'          => trim((string)$data['title']),
            'duration'       => trim((string)$data['duration']),
            'description'    => trim((string)$data['description']),
            'image_url'      => !empty($data['image_url']) ? trim((string)$data['image_url']) : null,
            'alt_text'       => !empty($data['alt_text']) ? trim((string)$data['alt_text']) : null,
            'price_amount'   => isset($data['price_amount']) && is_numeric($data['price_amount']) ? (float)$data['price_amount'] : null,
            'price_currency' => !empty($data['price_currency']) ? strtoupper(trim((string)$data['price_currency'])) : 'EUR',
            'price_unit'     => !empty($data['price_unit']) ? trim((string)$data['price_unit']) : null,
            'display_order'  => (int)($data['display_order'] ?? 0),
            'published'      => isset($data['published']) ? ((bool)$data['published'] ? 1 : 0) : 1,
            'publish_at'     => !empty($data['publish_at']) ? $data['publish_at'] : null,
            'unpublish_at'   => !empty($data['unpublish_at']) ? $data['unpublish_at'] : null,
        ]);

        if (isset($data['translations']) && is_array($data['translations'])) {
            $this->saveTranslations($id, $data['translations']);
        }

        jsonSuccess(['id' => $id], 'Paquete creado correctamente.', 201);
    }

    /**
     * PUT /api/packages/:id
     */
    public function update(string $id): void {
        requireAuth($this->pdo);
        $data = getJsonInput();

        $stmtCheck = $this->pdo->prepare('SELECT id FROM packages WHERE id = :id');
        $stmtCheck->execute(['id' => $id]);
        if (!$stmtCheck->fetch()) {
            jsonError('Paquete no encontrado.', 404);
        }

        $errors = $this->validatePackageData($data, false);
        if (!empty($errors)) {
            jsonError('Datos de paquete no válidos.', 422, $errors);
        }

        $stmt = $this->pdo->prepare('
            UPDATE packages SET
                title          = :title,
                duration       = :duration,
                description    = :description,
                image_url      = :image_url,
                alt_text       = :alt_text,
                price_amount   = :price_amount,
                price_currency = :price_currency,
                price_unit     = :price_unit,
                display_order  = :display_order,
                published      = :published,
                publish_at     = :publish_at,
                unpublish_at   = :unpublish_at,
                updated_at     = NOW()
            WHERE id = :id
        ');

        $stmt->execute([
            'id'             => $id,
            'title'          => trim((string)$data['title']),
            'duration'       => trim((string)$data['duration']),
            'description'    => trim((string)$data['description']),
            'image_url'      => !empty($data['image_url']) ? trim((string)$data['image_url']) : null,
            'alt_text'       => !empty($data['alt_text']) ? trim((string)$data['alt_text']) : null,
            'price_amount'   => isset($data['price_amount']) && is_numeric($data['price_amount']) ? (float)$data['price_amount'] : null,
            'price_currency' => !empty($data['price_currency']) ? strtoupper(trim((string)$data['price_currency'])) : 'EUR',
            'price_unit'     => !empty($data['price_unit']) ? trim((string)$data['price_unit']) : null,
            'display_order'  => (int)($data['display_order'] ?? 0),
            'published'      => isset($data['published']) ? ((bool)$data['published'] ? 1 : 0) : 1,
            'publish_at'     => !empty($data['publish_at']) ? $data['publish_at'] : null,
            'unpublish_at'   => !empty($data['unpublish_at']) ? $data['unpublish_at'] : null,
        ]);

        if (isset($data['translations']) && is_array($data['translations'])) {
            $this->saveTranslations($id, $data['translations']);
        }

        jsonSuccess(['id' => $id], 'Paquete actualizado correctamente.');
    }

    /**
     * DELETE /api/packages/:id
     */
    public function delete(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('DELETE FROM packages WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            jsonError('Paquete no encontrado.', 404);
        }

        jsonSuccess(null, 'Paquete eliminado correctamente.');
    }

    /**
     * PUT /api/packages/reorder
     */
    public function reorder(): void {
        requireAuth($this->pdo);
        $data = getJsonInput();

        $items = $data['items'] ?? $data;
        if (!is_array($items)) {
            jsonError('Se esperaba una lista de paquetes para reordenar.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE packages SET display_order = :display_order, updated_at = NOW() WHERE id = :id');

            foreach ($items as $idx => $item) {
                if (empty($item['id'])) continue;
                $stmt->execute([
                    'id'            => (string)$item['id'],
                    'display_order' => isset($item['display_order']) ? (int)$item['display_order'] : $idx,
                ]);
            }

            $this->pdo->commit();
            jsonSuccess(null, 'Orden de paquetes actualizado correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al reordenar paquetes: ' . $e->getMessage(), 422);
        }
    }

    /**
     * Validate package input fields
     */
    private function validatePackageData(array $data, bool $isCreate): array {
        $errors = [];

        if ($isCreate) {
            $id = trim((string)($data['id'] ?? ''));
            if (empty($id)) {
                $errors['id'] = "El 'id' (slug identificador) es obligatorio.";
            } elseif (!preg_match('/^[a-z0-9-]+$/', $id)) {
                $errors['id'] = "El 'id' debe contener solo letras minúsculas, números y guiones.";
            }
        }

        $required = ['title', 'duration', 'description'];
        foreach ($required as $field) {
            if (empty(trim((string)($data[$field] ?? '')))) {
                $errors[$field] = "El campo '{$field}' es obligatorio.";
            }
        }

        if (!empty($data['publish_at']) && !strtotime($data['publish_at'])) {
            $errors['publish_at'] = "Formato de fecha 'publish_at' no válido.";
        }

        if (!empty($data['unpublish_at']) && !strtotime($data['unpublish_at'])) {
            $errors['unpublish_at'] = "Formato de fecha 'unpublish_at' no válido.";
        }

        return $errors;
    }

    /**
     * Format package database row to standard API array
     */
    private function formatPackageResponse(array $row): array {
        return [
            'id'                   => $row['id'],
            'title'                => $row['title'],
            'duration'             => $row['duration'],
            'description'          => $row['description'],
            'image_url'            => $row['image_url'] ?? null,
            'alt_text'             => $row['alt_text'] ?? null,
            'price_amount'         => $row['price_amount'] !== null ? (float)$row['price_amount'] : null,
            'price_currency'       => $row['price_currency'] ?? 'EUR',
            'price_unit'           => $row['price_unit'] ?? null,
            'display_order'        => (int)$row['display_order'],
            'published'            => (bool)$row['published'],
            'publish_at'           => $row['publish_at'] ?? null,
            'unpublish_at'         => $row['unpublish_at'] ?? null,
            'is_currently_visible' => isset($row['is_currently_visible']) ? (bool)$row['is_currently_visible'] : true,
            'created_at'           => $row['created_at'],
            'updated_at'           => $row['updated_at'],
        ];
    }

    /**
     * Upsert package translations
     */
    private function saveTranslations(string $packageId, array $translations): void {
        foreach (['ca', 'en', 'fr'] as $loc) {
            if (!isset($translations[$loc])) continue;
            $t = $translations[$loc];
            $title = trim((string)($t['title'] ?? ''));
            $desc = trim((string)($t['description'] ?? ''));
            $unit = trim((string)($t['price_unit'] ?? ''));

            if (!empty($title) || !empty($desc)) {
                $stmt = $this->pdo->prepare('
                    INSERT INTO package_translations (package_id, locale, title, description, price_unit)
                    VALUES (:package_id, :locale, :title, :description, :price_unit)
                    ON DUPLICATE KEY UPDATE 
                        title = VALUES(title), 
                        description = VALUES(description),
                        price_unit = VALUES(price_unit)
                ');
                $stmt->execute([
                    'package_id'  => $packageId,
                    'locale'      => $loc,
                    'title'       => $title,
                    'description' => $desc,
                    'price_unit'  => !empty($unit) ? $unit : null,
                ]);
            } else {
                $stmt = $this->pdo->prepare('DELETE FROM package_translations WHERE package_id = :package_id AND locale = :locale');
                $stmt->execute([
                    'package_id' => $packageId,
                    'locale'     => $loc,
                ]);
            }
        }
    }
}

