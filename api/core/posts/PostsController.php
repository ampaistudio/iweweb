<?php
/**
 * iWE Dashboard API - Posts Controller
 * 
 * CRUD for blog/news posts with automated Meta social sync dispatch and multi-language support (ES, CA, EN, FR).
 */

declare(strict_types=1);

class PostsController {
    private PDO $pdo;
    private array $config;
    private MetaGraphService $metaService;

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->metaService = new MetaGraphService($pdo, $config);
    }

    /**
     * GET /api/posts
     * List posts (public sees only published; authenticated user sees all).
     * Query param: ?locale=es|ca|en|fr
     */
    public function list(): void {
        $user = getAuthenticatedUser($this->pdo);
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        if ($locale !== 'es') {
            $sql = '
                SELECT p.id, 
                       COALESCE(NULLIF(t.title, ""), p.title) AS title, 
                       p.slug, 
                       COALESCE(NULLIF(t.body, ""), p.body) AS body, 
                       p.cover_media_id, p.status, p.origin, p.reference_channels, 
                       p.created_by, p.published_at, p.created_at, p.updated_at,
                       u.display_name AS author_name,
                       m.filename AS cover_filename
                FROM posts p
                LEFT JOIN post_translations t ON t.post_id = p.id AND t.locale = :locale
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN media m ON p.cover_media_id = m.id
            ';
        } else {
            $sql = '
                SELECT p.id, p.title, p.slug, p.body, p.cover_media_id, p.status, p.origin, p.reference_channels, 
                       p.created_by, p.published_at, p.created_at, p.updated_at,
                       u.display_name AS author_name,
                       m.filename AS cover_filename
                FROM posts p
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN media m ON p.cover_media_id = m.id
            ';
        }

        if (!$user) {
            $sql .= ' WHERE p.status = "published" ';
        }

        $sql .= ' ORDER BY COALESCE(p.published_at, p.created_at) DESC ';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($locale !== 'es' ? ['locale' => $locale] : []);
        $posts = $stmt->fetchAll();

        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');

        // Fetch social links for these posts
        $postIds = array_column($posts, 'id');
        $socialLinksByPost = [];

        if (!empty($postIds)) {
            $inClause = implode(',', array_map('intval', $postIds));
            $stmtLinks = $this->pdo->query("
                SELECT post_id, platform, external_post_id, external_permalink, sync_status, sync_error, synced_at
                FROM post_social_links
                WHERE post_id IN ({$inClause})
            ");
            while ($link = $stmtLinks->fetch()) {
                $socialLinksByPost[$link['post_id']][] = $link;
            }
        }

        $formatted = array_map(function ($post) use ($publicBase, $socialLinksByPost) {
            $post['cover_image_url'] = $post['cover_filename'] ? $publicBase . '/' . $post['cover_filename'] : null;
            $post['social_links'] = $socialLinksByPost[$post['id']] ?? [];
            $post['reference_channels'] = !empty($post['reference_channels']) ? json_decode((string)$post['reference_channels'], true) : null;
            return $post;
        }, $posts);

        jsonSuccess($formatted);
    }

    /**
     * GET /api/posts/:id (or slug)
     * Query param: ?locale=es|ca|en|fr
     */
    public function get($idOrSlug): void {
        $user = getAuthenticatedUser($this->pdo);
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        $isNumeric = is_numeric($idOrSlug);
        $column = $isNumeric ? 'p.id' : 'p.slug';

        $sql = "
            SELECT p.id, p.title, p.slug, p.body, p.cover_media_id, p.status, p.origin, p.reference_channels, 
                   p.created_by, p.published_at, p.created_at, p.updated_at,
                   u.display_name AS author_name,
                   m.filename AS cover_filename
            FROM posts p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN media m ON p.cover_media_id = m.id
            WHERE {$column} = :identifier
        ";

        if (!$user) {
            $sql .= ' AND p.status = "published" ';
        }
        $sql .= ' LIMIT 1';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['identifier' => $idOrSlug]);
        $post = $stmt->fetch();

        if (!$post) {
            jsonError('Publicación no encontrada.', 404);
        }

        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');
        $post['cover_image_url'] = $post['cover_filename'] ? $publicBase . '/' . $post['cover_filename'] : null;
        $post['reference_channels'] = !empty($post['reference_channels']) ? json_decode((string)$post['reference_channels'], true) : null;

        // Fetch social links
        $stmtLinks = $this->pdo->prepare('
            SELECT platform, external_post_id, external_permalink, sync_status, sync_error, synced_at
            FROM post_social_links
            WHERE post_id = :post_id
        ');
        $stmtLinks->execute(['post_id' => $post['id']]);
        $post['social_links'] = $stmtLinks->fetchAll();

        // Fetch translations for all locales (CA, EN, FR)
        $translations = [
            'ca' => ['title' => '', 'body' => ''],
            'en' => ['title' => '', 'body' => ''],
            'fr' => ['title' => '', 'body' => ''],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, title, body FROM post_translations WHERE post_id = :id');
        $stmtT->execute(['id' => $post['id']]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['title'] = $t['title'];
                $translations[$loc]['body'] = $t['body'];
            }
        }

        $post['translations'] = $translations;

        // Apply localization if requested
        if ($locale !== 'es' && isset($translations[$locale])) {
            if (!empty($translations[$locale]['title'])) {
                $post['title'] = $translations[$locale]['title'];
            }
            if (!empty($translations[$locale]['body'])) {
                $post['body'] = $translations[$locale]['body'];
            }
        }

        jsonSuccess($post);
    }

    /**
     * POST /api/posts
     * Create a post and its translations (requires authentication)
     */
    public function create(): void {
        $user = requireAuth($this->pdo);
        $body = getRequestBody();

        $title = trim($body['title'] ?? '');
        $postBody = trim($body['body'] ?? '');
        $status = in_array($body['status'] ?? '', ['draft', 'published'], true) ? $body['status'] : 'draft';
        $coverMediaId = !empty($body['cover_media_id']) ? (int)$body['cover_media_id'] : null;

        if (empty($title)) {
            jsonError('El título del post es obligatorio.', 422);
        }
        if (empty($postBody)) {
            jsonError('El contenido del post es obligatorio.', 422);
        }

        $refChannelsJson = $this->sanitizeReferenceChannels($body['reference_channels'] ?? null);

        // Generate clean unique slug
        $baseSlug = !empty($body['slug']) ? slugify($body['slug']) : slugify($title);
        $slug = $this->generateUniqueSlug($baseSlug);

        $publishedAt = ($status === 'published') ? date('Y-m-d H:i:s') : null;

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('
                INSERT INTO posts (title, slug, body, cover_media_id, status, origin, reference_channels, created_by, published_at, created_at)
                VALUES (:title, :slug, :body, :cover_media_id, :status, "web", :reference_channels, :created_by, :published_at, NOW())
            ');

            $stmt->execute([
                'title'              => $title,
                'slug'               => $slug,
                'body'               => $postBody,
                'cover_media_id'     => $coverMediaId,
                'status'             => $status,
                'reference_channels' => $refChannelsJson,
                'created_by'         => $user['id'],
                'published_at'       => $publishedAt,
            ]);

            $postId = (int)$this->pdo->lastInsertId();

            // Save translations (CA, EN, FR)
            $this->saveTranslations($postId, $body['translations'] ?? []);

            $this->pdo->commit();

            // Social dispatch if requested and post is published
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $socialResults = [];

            if ($status === 'published' && ($publishFb || $publishIg)) {
                $imageUrl = null;
                if ($coverMediaId) {
                    $imageUrl = $this->getPublicMediaUrl($coverMediaId);
                }
                $socialResults = $this->metaService->publishPost($postId, $title, $postBody, $imageUrl, $publishFb, $publishIg);
            }

            jsonSuccess([
                'id'             => $postId,
                'title'          => $title,
                'slug'           => $slug,
                'status'         => $status,
                'social_sync'    => $socialResults,
            ], 'Publicación creada exitosamente.', 201);

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al guardar la publicación: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/posts/:id
     * Update a post and its translations (requires authentication)
     */
    public function update(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id, title, slug, status, cover_media_id FROM posts WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            jsonError('Publicación no encontrada.', 404);
        }

        $body = getRequestBody();
        $title = trim($body['title'] ?? $existing['title']);
        $postBody = isset($body['body']) ? trim($body['body']) : null;
        $status = in_array($body['status'] ?? '', ['draft', 'published'], true) ? $body['status'] : $existing['status'];
        $coverMediaId = array_key_exists('cover_media_id', $body) ? ($body['cover_media_id'] ? (int)$body['cover_media_id'] : null) : $existing['cover_media_id'];

        if (empty($title)) {
            jsonError('El título no puede estar vacío.', 422);
        }

        $slug = $existing['slug'];
        if (!empty($body['slug']) && $body['slug'] !== $existing['slug']) {
            $slug = $this->generateUniqueSlug(slugify($body['slug']), $id);
        }

        $publishedAt = null;
        if ($status === 'published' && $existing['status'] === 'draft') {
            $publishedAt = date('Y-m-d H:i:s');
        }

        $this->pdo->beginTransaction();
        try {
            $sql = '
                UPDATE posts 
                SET title = :title, slug = :slug, status = :status, cover_media_id = :cover_media_id, updated_at = NOW()
            ';
            $params = [
                'id'             => $id,
                'title'          => $title,
                'slug'           => $slug,
                'status'         => $status,
                'cover_media_id' => $coverMediaId,
            ];

            if ($postBody !== null) {
                $sql .= ', body = :body';
                $params['body'] = $postBody;
            }

            if (array_key_exists('reference_channels', $body)) {
                $sql .= ', reference_channels = :reference_channels';
                $params['reference_channels'] = $this->sanitizeReferenceChannels($body['reference_channels']);
            }

            if ($publishedAt !== null) {
                $sql .= ', published_at = :published_at';
                $params['published_at'] = $publishedAt;
            }

            $sql .= ' WHERE id = :id';

            $stmtUpdate = $this->pdo->prepare($sql);
            $stmtUpdate->execute($params);

            // Save translations (CA, EN, FR)
            if (isset($body['translations']) && is_array($body['translations'])) {
                $this->saveTranslations($id, $body['translations']);
            }

            $this->pdo->commit();

            // Handle social dispatch (new publish or retry)
            $publishFb = !empty($body['publish_to_facebook']);
            $publishIg = !empty($body['publish_to_instagram']);
            $retryPlatform = $body['retry_platform'] ?? null;
            $socialResults = [];

            $imageUrl = null;
            if ($coverMediaId) {
                $imageUrl = $this->getPublicMediaUrl($coverMediaId);
            }

            $fullBodyText = $postBody ?? '';
            if (empty($fullBodyText)) {
                $stmtFull = $this->pdo->prepare('SELECT body FROM posts WHERE id = :id');
                $stmtFull->execute(['id' => $id]);
                $fullBodyText = $stmtFull->fetchColumn() ?: '';
            }

            if ($status === 'published' && ($publishFb || $publishIg)) {
                $socialResults = $this->metaService->publishPost($id, $title, $fullBodyText, $imageUrl, $publishFb, $publishIg);
            } elseif ($retryPlatform === 'facebook') {
                $socialResults['facebook'] = $this->metaService->publishToFacebook($id, $title . "\n\n" . strip_tags($fullBodyText), $imageUrl);
            } elseif ($retryPlatform === 'instagram') {
                $socialResults['instagram'] = $this->metaService->publishToInstagram($id, $title . "\n\n" . strip_tags($fullBodyText), $imageUrl);
            }

            jsonSuccess([
                'id'          => $id,
                'title'       => $title,
                'slug'        => $slug,
                'status'      => $status,
                'social_sync' => $socialResults,
            ], 'Publicación actualizada correctamente.');

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al actualizar la publicación: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/posts/:id
     * Delete a post (requires authentication)
     */
    public function delete(int $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT id FROM posts WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            jsonError('Publicación no encontrada.', 404);
        }

        $stmtDel = $this->pdo->prepare('DELETE FROM posts WHERE id = :id');
        $stmtDel->execute(['id' => $id]);

        jsonSuccess(null, 'Publicación eliminada correctamente.');
    }

    private function saveTranslations(int $postId, array $translations): void {
        foreach (['ca', 'en', 'fr'] as $loc) {
            if (!isset($translations[$loc]) || !is_array($translations[$loc])) {
                continue;
            }

            $tTitle = trim((string)($translations[$loc]['title'] ?? ''));
            $tBody = trim((string)($translations[$loc]['body'] ?? ''));

            if ($tTitle !== '' || $tBody !== '') {
                $stmt = $this->pdo->prepare('
                    INSERT INTO post_translations (post_id, locale, title, body, created_at, updated_at)
                    VALUES (:post_id, :locale, :title, :body, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                        title = VALUES(title), 
                        body = VALUES(body), 
                        updated_at = NOW()
                ');
                $stmt->execute([
                    'post_id' => $postId,
                    'locale'  => $loc,
                    'title'   => $tTitle,
                    'body'    => $tBody,
                ]);
            } else {
                $stmt = $this->pdo->prepare('DELETE FROM post_translations WHERE post_id = :post_id AND locale = :locale');
                $stmt->execute(['post_id' => $postId, 'locale' => $loc]);
            }
        }
    }

    private function generateUniqueSlug(string $baseSlug, ?int $ignorePostId = null): string {
        $slug = $baseSlug;
        $counter = 1;

        while (true) {
            $sql = 'SELECT id FROM posts WHERE slug = :slug';
            $params = ['slug' => $slug];
            if ($ignorePostId !== null) {
                $sql .= ' AND id != :ignore_id';
                $params['ignore_id'] = $ignorePostId;
            }
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }
    }

    private function getPublicMediaUrl(int $mediaId): ?string {
        $stmt = $this->pdo->prepare('SELECT filename FROM media WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $mediaId]);
        $filename = $stmt->fetchColumn();
        if (!$filename) {
            return null;
        }

        $baseUrl = rtrim($this->config['app']['base_url'] ?? '', '/');
        return $baseUrl . '/uploads/' . $filename;
    }

    private function sanitizeReferenceChannels(mixed $input): ?string {
        if ($input === null) {
            return null;
        }
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            if (is_array($decoded)) {
                $input = $decoded;
            }
        }
        if (is_array($input)) {
            $sanitized = [];
            foreach ($input as $item) {
                if (is_string($item) || is_numeric($item)) {
                    $clean = trim((string)$item);
                    if ($clean !== '') {
                        $sanitized[] = $clean;
                    }
                }
            }
            return !empty($sanitized) ? json_encode(array_values(array_unique($sanitized)), JSON_UNESCAPED_UNICODE) : null;
        }
        return null;
    }
}
