<?php
/**
 * iWE Dashboard API - Activity Social Controller
 * 
 * Handles manual and automated social media sharing (Facebook & Instagram) for activities.
 */

declare(strict_types=1);

class ActivitySocialController {
    private PDO $pdo;
    private array $config;
    private MetaGraphService $metaService;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        require_once __DIR__ . '/../core/social/MetaGraphService.php';
        $this->metaService = new MetaGraphService($pdo, $config);
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
    public function resolvePublicImageUrl(?string $imageUrl): ?string {
        if (empty($imageUrl)) {
            return null;
        }
        if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            return $imageUrl;
        }

        if (str_starts_with($imageUrl, '/api/uploads/')) {
            $filename = basename($imageUrl);
            return 'https://i-wildland.com/api/uploads/' . $filename;
        }
        return 'https://i-wildland.com/' . ltrim($imageUrl, '/');
    }
}

