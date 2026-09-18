<?php
/**
 * iWE Dashboard API - Menu Controller (Domain: Navigation Tree)
 * 
 * Manages hierarchical menu items, visibility scheduling (publish_at / unpublish_at),
 * and multi-language translations (ES, CA, EN, FR).
 */

declare(strict_types=1);

class MenuController {
    private PDO $pdo;
    private array $config;

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];
    public const ALLOWED_LINK_TYPES = ['route', 'anchor', 'activity', 'package', 'external'];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/menu
     * Returns hierarchical navigation tree.
     * Public requests only receive currently visible items (published + active schedule).
     * Authenticated requests with ?includeUnpublished=1 receive the full tree with visibility flags.
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
            $where[] = 'm.published = 1';
            $where[] = '(m.publish_at IS NULL OR m.publish_at <= NOW())';
            $where[] = '(m.unpublish_at IS NULL OR m.unpublish_at > NOW())';
        }

        if ($locale !== 'es') {
            $params['locale'] = $locale;
            $sql = '
                SELECT 
                    m.id,
                    m.parent_id,
                    COALESCE(NULLIF(t.label, ""), m.label) AS label,
                    m.link_type,
                    m.target_value,
                    m.display_order,
                    m.published,
                    m.publish_at,
                    m.unpublish_at,
                    m.created_at,
                    m.updated_at,
                    (
                        m.published = 1 
                        AND (m.publish_at IS NULL OR m.publish_at <= NOW()) 
                        AND (m.unpublish_at IS NULL OR m.unpublish_at > NOW())
                    ) AS is_currently_visible
                FROM menu_items m
                LEFT JOIN menu_item_translations t ON t.menu_item_id = m.id AND t.locale = :locale
            ';
        } else {
            $sql = '
                SELECT 
                    m.*,
                    (
                        m.published = 1 
                        AND (m.publish_at IS NULL OR m.publish_at <= NOW()) 
                        AND (m.unpublish_at IS NULL OR m.unpublish_at > NOW())
                    ) AS is_currently_visible
                FROM menu_items m
            ';
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY m.display_order ASC, m.id ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Build hierarchical tree
        $tree = $this->buildTree($rows);

        jsonSuccess($tree);
    }

    /**
     * GET /api/menu/:id
     * Returns single menu item with translations for dashboard editing.
     */
    public function get(int $id): void {
        $user = requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('
            SELECT 
                m.*,
                (
                    m.published = 1 
                    AND (m.publish_at IS NULL OR m.publish_at <= NOW()) 
                    AND (m.unpublish_at IS NULL OR m.unpublish_at > NOW())
                ) AS is_currently_visible
            FROM menu_items m 
            WHERE m.id = :id 
            LIMIT 1
        ');
        $stmt->execute(['id' => $id]);
        $item = $stmt->fetch();

        if (!$item) {
            jsonError('Elemento de menú no encontrado.', 404);
        }

        // Fetch translations
        $translations = [
            'ca' => ['label' => ''],
            'en' => ['label' => ''],
            'fr' => ['label' => ''],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, label FROM menu_item_translations WHERE menu_item_id = :id');
        $stmtT->execute(['id' => $id]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['label'] = $t['label'];
            }
        }

        jsonSuccess([
            'id'                   => (int)$item['id'],
            'parent_id'            => $item['parent_id'] !== null ? (int)$item['parent_id'] : null,
            'label'                => $item['label'],
            'link_type'            => $item['link_type'],
            'target_value'         => $item['target_value'],
            'display_order'        => (int)$item['display_order'],
            'published'            => (bool)$item['published'],
            'publish_at'           => $item['publish_at'],
            'unpublish_at'         => $item['unpublish_at'],
            'is_currently_visible' => (bool)$item['is_currently_visible'],
            'translations'         => $translations,
            'created_at'           => $item['created_at'],
            'updated_at'           => $item['updated_at'],
        ]);
    }

    /**
     * POST /api/menu
     * Create new menu item.
     */
    public function create(): void {
        requireAuth($this->pdo);
        $data = getRequestBody();

        $errors = $this->validateMenuItemData($data, true);
        if (!empty($errors)) {
            jsonError('Datos de menú no válidos.', 422, $errors);
        }

        $parentId = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

        if ($parentId !== null) {
            $stmtP = $this->pdo->prepare('SELECT id FROM menu_items WHERE id = :id');
            $stmtP->execute(['id' => $parentId]);
            if (!$stmtP->fetch()) {
                jsonError('El elemento padre especificado no existe.', 422, ['parent_id' => 'Padre no válido']);
            }
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at, created_at, updated_at)
            VALUES (:parent_id, :label, :link_type, :target_value, :display_order, :published, :publish_at, :unpublish_at, NOW(), NOW())
        ');

        $stmt->execute([
            'parent_id'     => $parentId,
            'label'         => trim((string)$data['label']),
            'link_type'     => $data['link_type'],
            'target_value'  => trim((string)$data['target_value']),
            'display_order' => (int)($data['display_order'] ?? 0),
            'published'     => isset($data['published']) ? ((bool)$data['published'] ? 1 : 0) : 1,
            'publish_at'    => !empty($data['publish_at']) ? $data['publish_at'] : null,
            'unpublish_at'  => !empty($data['unpublish_at']) ? $data['unpublish_at'] : null,
        ]);

        $newId = (int)$this->pdo->lastInsertId();

        if (isset($data['translations']) && is_array($data['translations'])) {
            $this->saveTranslations($newId, $data['translations']);
        }

        jsonSuccess(['id' => $newId], 'Elemento de menú creado correctamente.', 201);
    }

    /**
     * PUT /api/menu/:id
     * Update existing menu item.
     */
    public function update(int $id): void {
        requireAuth($this->pdo);
        $data = getRequestBody();

        $stmtCheck = $this->pdo->prepare('SELECT id FROM menu_items WHERE id = :id');
        $stmtCheck->execute(['id' => $id]);
        if (!$stmtCheck->fetch()) {
            jsonError('Elemento de menú no encontrado.', 404);
        }

        $errors = $this->validateMenuItemData($data, false);
        if (!empty($errors)) {
            jsonError('Datos de menú no válidos.', 422, $errors);
        }

        $parentId = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

        // Prevent circular parent dependency
        if ($parentId !== null) {
            if ($parentId === $id) {
                jsonError('Un elemento de menú no puede ser su propio padre.', 422, ['parent_id' => 'Jerarquía circular detectada']);
            }
            if ($this->isDescendant($id, $parentId)) {
                jsonError('No se puede asignar un subelemento como padre (ciclo detectado).', 422, ['parent_id' => 'Jerarquía circular detectada']);
            }
        }

        $stmt = $this->pdo->prepare('
            UPDATE menu_items SET
                parent_id     = :parent_id,
                label         = :label,
                link_type     = :link_type,
                target_value  = :target_value,
                display_order = :display_order,
                published     = :published,
                publish_at    = :publish_at,
                unpublish_at  = :unpublish_at,
                updated_at    = NOW()
            WHERE id = :id
        ');

        $stmt->execute([
            'id'            => $id,
            'parent_id'     => $parentId,
            'label'         => trim((string)$data['label']),
            'link_type'     => $data['link_type'],
            'target_value'  => trim((string)$data['target_value']),
            'display_order' => (int)($data['display_order'] ?? 0),
            'published'     => isset($data['published']) ? ((bool)$data['published'] ? 1 : 0) : 1,
            'publish_at'    => !empty($data['publish_at']) ? $data['publish_at'] : null,
            'unpublish_at'  => !empty($data['unpublish_at']) ? $data['unpublish_at'] : null,
        ]);

        if (isset($data['translations']) && is_array($data['translations'])) {
            $this->saveTranslations($id, $data['translations']);
        }

        jsonSuccess(['id' => $id], 'Elemento de menú actualizado correctamente.');
    }

    /**
     * DELETE /api/menu/:id
     */
    public function delete(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('DELETE FROM menu_items WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            jsonError('Elemento de menú no encontrado.', 404);
        }

        jsonSuccess(null, 'Elemento de menú eliminado correctamente.');
    }

    /**
     * PUT /api/menu/reorder
     * Batch updates parent_id and display_order for drag-and-drop hierarchy.
     */
    public function reorder(): void {
        requireAuth($this->pdo);
        $data = getRequestBody();

        $items = $data['items'] ?? $data;
        if (!is_array($items)) {
            jsonError('Se esperaba una lista de elementos para reordenar.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('
                UPDATE menu_items 
                SET parent_id = :parent_id, display_order = :display_order, updated_at = NOW() 
                WHERE id = :id
            ');

            foreach ($items as $idx => $item) {
                if (empty($item['id'])) continue;
                $itemId = (int)$item['id'];
                $parentId = !empty($item['parent_id']) ? (int)$item['parent_id'] : null;
                $order = isset($item['display_order']) ? (int)$item['display_order'] : $idx;

                if ($parentId === $itemId) {
                    throw new InvalidArgumentException("Elemento {$itemId} no puede ser su propio padre.");
                }

                $stmt->execute([
                    'id'            => $itemId,
                    'parent_id'     => $parentId,
                    'display_order' => $order,
                ]);
            }

            $this->pdo->commit();
            jsonSuccess(null, 'Orden del menú actualizado correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al reordenar elementos: ' . $e->getMessage(), 422);
        }
    }

    /**
     * Check if a candidate node is a descendant of the source node (cycle prevention)
     */
    private function isDescendant(int $sourceId, int $candidateParentId): bool {
        $currentId = $candidateParentId;
        $visited = [];

        while ($currentId !== null) {
            if ($currentId === $sourceId) {
                return true;
            }
            if (isset($visited[$currentId])) {
                return true; // Loop detected
            }
            $visited[$currentId] = true;

            $stmt = $this->pdo->prepare('SELECT parent_id FROM menu_items WHERE id = :id');
            $stmt->execute(['id' => $currentId]);
            $row = $stmt->fetch();
            if (!$row || $row['parent_id'] === null) {
                break;
            }
            $currentId = (int)$row['parent_id'];
        }

        return false;
    }

    /**
     * Build nested array tree from flat list
     */
    private function buildTree(array $rows): array {
        $itemsById = [];
        foreach ($rows as $row) {
            $itemsById[(int)$row['id']] = [
                'id'                   => (int)$row['id'],
                'parent_id'            => $row['parent_id'] !== null ? (int)$row['parent_id'] : null,
                'label'                => $row['label'],
                'link_type'            => $row['link_type'],
                'target_value'         => $row['target_value'],
                'display_order'        => (int)$row['display_order'],
                'published'            => (bool)$row['published'],
                'publish_at'           => $row['publish_at'] ?? null,
                'unpublish_at'         => $row['unpublish_at'] ?? null,
                'is_currently_visible' => (bool)$row['is_currently_visible'],
                'created_at'           => $row['created_at'],
                'updated_at'           => $row['updated_at'],
                'children'             => [],
            ];
        }

        $tree = [];
        foreach ($itemsById as $id => &$item) {
            if ($item['parent_id'] !== null) {
                if (isset($itemsById[$item['parent_id']])) {
                    $itemsById[$item['parent_id']]['children'][] = &$item;
                }
                // If parent is filtered out (unpublished/hidden), child is suppressed from root level
            } else {
                $tree[] = &$item;
            }
        }
        unset($item);

        return $tree;
    }

    /**
     * Validate menuItem input fields
     */
    private function validateMenuItemData(array $data, bool $isCreate): array {
        $errors = [];

        if (empty(trim((string)($data['label'] ?? '')))) {
            $errors['label'] = "El campo 'label' es obligatorio.";
        }

        $linkType = $data['link_type'] ?? '';
        if (!in_array($linkType, self::ALLOWED_LINK_TYPES, true)) {
            $allowed = implode(', ', self::ALLOWED_LINK_TYPES);
            $errors['link_type'] = "Tipo de enlace inválido '{$linkType}'. Valores permitidos: {$allowed}";
        }

        if (empty(trim((string)($data['target_value'] ?? '')))) {
            $errors['target_value'] = "El campo 'target_value' es obligatorio.";
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
     * Upsert menu item translations
     */
    private function saveTranslations(int $menuItemId, array $translations): void {
        foreach (['ca', 'en', 'fr'] as $loc) {
            if (!isset($translations[$loc])) continue;
            $t = $translations[$loc];
            $label = trim((string)($t['label'] ?? ''));

            if (!empty($label)) {
                $stmt = $this->pdo->prepare('
                    INSERT INTO menu_item_translations (menu_item_id, locale, label)
                    VALUES (:menu_item_id, :locale, :label)
                    ON DUPLICATE KEY UPDATE label = VALUES(label)
                ');
                $stmt->execute([
                    'menu_item_id' => $menuItemId,
                    'locale'       => $loc,
                    'label'        => $label,
                ]);
            } else {
                $stmt = $this->pdo->prepare('DELETE FROM menu_item_translations WHERE menu_item_id = :menu_item_id AND locale = :locale');
                $stmt->execute([
                    'menu_item_id' => $menuItemId,
                    'locale'       => $loc,
                ]);
            }
        }
    }
}
