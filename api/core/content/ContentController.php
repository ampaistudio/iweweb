<?php
/**
 * iWE Dashboard API - Site Content Controller
 * 
 * Manages institutional key/value site text snippets.
 */

class ContentController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/content
     * Publicly returns all institutional texts as a key-value dictionary
     */
    public function list(): void {
        $stmt = $this->pdo->query('SELECT content_key, content_value, updated_at FROM site_content ORDER BY content_key ASC');
        $rows = $stmt->fetchAll();

        $contentMap = [];
        foreach ($rows as $row) {
            $contentMap[$row['content_key']] = $row['content_value'];
        }

        jsonSuccess([
            'content'  => $contentMap,
            'raw'      => $rows,
        ]);
    }

    /**
     * PUT /api/content/:key
     * Update an institutional text (requires authentication)
     */
    public function update(string $key): void {
        requireAuth($this->pdo);

        $key = trim($key);
        if (empty($key) || strlen($key) > 80) {
            jsonError('La clave de contenido no es válida (máximo 80 caracteres).', 422);
        }

        $body = getRequestBody();
        $value = $body['content_value'] ?? $body['value'] ?? null;

        if ($value === null) {
            jsonError('El valor de contenido (content_value) es requerido.', 422);
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO site_content (content_key, content_value, updated_at)
            VALUES (:key, :value, NOW())
            ON DUPLICATE KEY UPDATE 
                content_value = VALUES(content_value),
                updated_at = NOW()
        ');

        $stmt->execute([
            'key'   => $key,
            'value' => (string)$value,
        ]);

        jsonSuccess([
            'content_key'   => $key,
            'content_value' => (string)$value,
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'Texto institucional actualizado correctamente.');
    }
}
