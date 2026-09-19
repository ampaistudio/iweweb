<?php
/**
 * iWE Dashboard API - Activity Types (Categories) Controller
 * 
 * Provides dynamic CRUD management and reordering for activity categories.
 */

declare(strict_types=1);

class ActivityTypeController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/activity-types
     * Lists all activity categories ordered by display_order with activity count.
     */
    public function list(): void {
        $stmt = $this->pdo->query('
            SELECT 
                at.id,
                at.name,
                at.display_order,
                at.created_at,
                at.updated_at,
                COUNT(a.id) AS activities_count
            FROM activity_types at
            LEFT JOIN activities a ON a.type = at.name
            GROUP BY at.id, at.name, at.display_order, at.created_at, at.updated_at
            ORDER BY at.display_order ASC, at.name ASC
        ');
        $types = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cast numeric fields
        $types = array_map(function ($t) {
            return [
                'id'               => (int)$t['id'],
                'name'             => (string)$t['name'],
                'display_order'    => (int)$t['display_order'],
                'activities_count' => (int)$t['activities_count'],
                'created_at'       => (string)$t['created_at'],
                'updated_at'       => (string)$t['updated_at'],
            ];
        }, $types);

        jsonSuccess($types);
    }

    /**
     * POST /api/activity-types
     * Creates a new activity category.
     */
    public function create(): void {
        requireAuth($this->pdo);

        $body = getRequestBody();
        $name = trim($body['name'] ?? '');
        $displayOrder = isset($body['display_order']) ? (int)$body['display_order'] : null;

        if ($name === '') {
            jsonError('El nombre de la categoría es obligatorio.', 422);
        }

        // Check uniqueness
        $stmtCheck = $this->pdo->prepare('SELECT id FROM activity_types WHERE LOWER(name) = LOWER(?) LIMIT 1');
        $stmtCheck->execute([$name]);
        if ($stmtCheck->fetch()) {
            jsonError("Ya existe una categoría con el nombre '{$name}'.", 409);
        }

        if ($displayOrder === null) {
            $maxOrder = (int)$this->pdo->query('SELECT COALESCE(MAX(display_order), 0) FROM activity_types')->fetchColumn();
            $displayOrder = $maxOrder + 1;
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO activity_types (name, display_order)
            VALUES (?, ?)
        ');
        $stmt->execute([$name, $displayOrder]);
        $newId = (int)$this->pdo->lastInsertId();

        jsonSuccess([
            'id'               => $newId,
            'name'             => $name,
            'display_order'    => $displayOrder,
            'activities_count' => 0,
        ], 'Categoría creada exitosamente.');
    }

    /**
     * PUT /api/activity-types/:id
     * Updates category name and/or display_order. If name is renamed, updates activities referencing old name.
     */
    public function update(int $id): void {
        requireAuth($this->pdo);

        $stmtCurrent = $this->pdo->prepare('SELECT * FROM activity_types WHERE id = ?');
        $stmtCurrent->execute([$id]);
        $current = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

        if (!$current) {
            jsonError('Categoría no encontrada.', 404);
        }

        $body = getRequestBody();
        $newName = isset($body['name']) ? trim($body['name']) : (string)$current['name'];
        $displayOrder = isset($body['display_order']) ? (int)$body['display_order'] : (int)$current['display_order'];

        if ($newName === '') {
            jsonError('El nombre de la categoría no puede estar vacío.', 422);
        }

        // Check if name is taken by another category
        if (mb_strtolower($newName) !== mb_strtolower($current['name'])) {
            $stmtCheck = $this->pdo->prepare('SELECT id FROM activity_types WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1');
            $stmtCheck->execute([$newName, $id]);
            if ($stmtCheck->fetch()) {
                jsonError("Ya existe otra categoría con el nombre '{$newName}'.", 409);
            }
        }

        $this->pdo->beginTransaction();
        try {
            $stmtUpdate = $this->pdo->prepare('
                UPDATE activity_types 
                SET name = ?, display_order = ? 
                WHERE id = ?
            ');
            $stmtUpdate->execute([$newName, $displayOrder, $id]);

            // If name changed, update activities that were referencing the old name
            if ($newName !== $current['name']) {
                $stmtCascade = $this->pdo->prepare('
                    UPDATE activities 
                    SET type = ? 
                    WHERE type = ?
                ');
                $stmtCascade->execute([$newName, $current['name']]);
            }

            $this->pdo->commit();

            jsonSuccess([
                'id'            => $id,
                'name'          => $newName,
                'display_order' => $displayOrder,
            ], 'Categoría actualizada exitosamente.');

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al actualizar la categoría: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/activity-types/:id
     * Deletes category only if no activities are currently assigned to it.
     */
    public function delete(int $id): void {
        requireAuth($this->pdo);

        $stmtCurrent = $this->pdo->prepare('SELECT * FROM activity_types WHERE id = ?');
        $stmtCurrent->execute([$id]);
        $current = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

        if (!$current) {
            jsonError('Categoría no encontrada.', 404);
        }

        $categoryName = (string)$current['name'];

        // Check if any activities are using this category
        $stmtCount = $this->pdo->prepare('SELECT COUNT(*) FROM activities WHERE type = ?');
        $stmtCount->execute([$categoryName]);
        $count = (int)$stmtCount->fetchColumn();

        if ($count > 0) {
            jsonError("No se puede eliminar la categoría '{$categoryName}' porque está asignada a {$count} actividad(es). Reasigna o elimina esas actividades antes de borrar la categoría.", 400);
        }

        $stmtDelete = $this->pdo->prepare('DELETE FROM activity_types WHERE id = ?');
        $stmtDelete->execute([$id]);

        jsonSuccess(null, "Categoría '{$categoryName}' eliminada exitosamente.");
    }

    /**
     * PUT /api/activity-types/reorder
     * Updates display_order for multiple categories at once.
     */
    public function reorder(): void {
        requireAuth($this->pdo);

        $body = getRequestBody();
        $items = $body['items'] ?? [];

        if (!is_array($items) || empty($items)) {
            jsonError('Se requiere un listado de categorías con su nuevo orden.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('UPDATE activity_types SET display_order = ? WHERE id = ?');
            foreach ($items as $index => $item) {
                $id = (int)($item['id'] ?? 0);
                $order = isset($item['display_order']) ? (int)$item['display_order'] : ($index + 1);
                if ($id > 0) {
                    $stmt->execute([$order, $id]);
                }
            }
            $this->pdo->commit();
            jsonSuccess(null, 'Orden de categorías actualizado correctamente.');
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al reordenar categorías: ' . $e->getMessage(), 500);
        }
    }
}
