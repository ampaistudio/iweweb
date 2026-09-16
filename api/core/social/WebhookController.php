<?php
/**
 * iWE Dashboard API - Meta Webhook Controller
 * 
 * Receives and validates real-time webhooks from Facebook and Instagram.
 * Verifies X-Hub-Signature-256 for request integrity and ingests new posts into the site.
 */

class WebhookController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Handle incoming webhook requests (GET for verification handshake, POST for event ingestion)
     */
    public function handle(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $this->verifySubscription();
        } elseif ($method === 'POST') {
            $this->receiveEvents();
        } else {
            jsonError('Método HTTP no soportado para webhooks.', 405);
        }
    }

    /**
     * GET verification challenge from Meta
     */
    private function verifySubscription(): void {
        $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';

        $configuredToken = $this->config['meta']['verify_token'] ?? '';

        if ($mode === 'subscribe' && !empty($configuredToken) && $token === $configuredToken) {
            http_response_code(200);
            header('Content-Type: text/plain; charset=utf-8');
            echo $challenge;
            exit;
        }

        jsonError('Verificación de webhook fallida. Token no coincide o modo inválido.', 403);
    }

    /**
     * POST events from Meta Graph API
     */
    private function receiveEvents(): void {
        $rawPayload = file_get_contents('php://input');
        $signatureHeader = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

        $appSecret = $this->config['meta']['app_secret'] ?? '';

        // Validate HMAC SHA-256 signature if app secret is configured
        if (!empty($appSecret)) {
            if (empty($signatureHeader) || !str_starts_with($signatureHeader, 'sha256=')) {
                jsonError('Firma X-Hub-Signature-256 faltante o con formato inválido.', 403);
            }

            $expectedSignature = hash_hmac('sha256', $rawPayload, $appSecret);
            $receivedSignature = substr($signatureHeader, 7);

            if (!hash_equals($expectedSignature, $receivedSignature)) {
                jsonError('Firma criptográfica de webhook inválida. Petición rechazada.', 403);
            }
        }

        $data = json_decode($rawPayload, true);
        if (!$data || !isset($data['entry']) || !is_array($data['entry'])) {
            // Meta expects 200 even on unhandled payloads to avoid retry storms
            http_response_code(200);
            echo 'EVENT_RECEIVED';
            exit;
        }

        $this->processEntries($data);

        http_response_code(200);
        echo 'EVENT_RECEIVED';
        exit;
    }

    /**
     * Process Facebook and Instagram feed updates
     */
    private function processEntries(array $payload): void {
        $objectType = $payload['object'] ?? 'page'; // 'page' or 'instagram'

        // Default author for ingested posts (Christian / Admin #1)
        $authorId = 1;

        foreach ($payload['entry'] as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $field = $change['field'] ?? '';
                $value = $change['value'] ?? [];

                if ($field === 'feed' || $field === 'posts' || $field === 'media') {
                    $this->ingestSocialPost($objectType, $value, $authorId);
                }
            }
        }
    }

    /**
     * Parse and insert incoming social post if not already imported
     */
    private function ingestSocialPost(string $objectType, array $data, int $authorId): void {
        $item = $data['item'] ?? '';
        $verb = $data['verb'] ?? 'add';

        if ($verb !== 'add' && $verb !== 'edit') {
            return;
        }

        $platform = ($objectType === 'instagram') ? 'instagram' : 'facebook';
        $externalId = (string)($data['post_id'] ?? $data['id'] ?? $data['media_id'] ?? '');

        if (empty($externalId)) {
            return;
        }

        // Check if post already recorded
        $stmtCheck = $this->pdo->prepare('SELECT post_id FROM post_social_links WHERE platform = :platform AND external_post_id = :external_id LIMIT 1');
        $stmtCheck->execute([
            'platform'    => $platform,
            'external_id' => $externalId,
        ]);
        if ($stmtCheck->fetch()) {
            return; // Already ingested
        }

        $message = trim($data['message'] ?? $data['caption'] ?? '');
        if (empty($message)) {
            $message = "Nueva publicación en {$platform}";
        }

        // Extract clean title from first sentence/line
        $lines = explode("\n", $message);
        $firstLine = trim($lines[0]);
        $title = mb_substr($firstLine, 0, 120);
        if (mb_strlen($firstLine) > 120) {
            $title .= '...';
        }

        $slugBase = slugify($title);
        $slug = $slugBase . '-' . substr(md5($externalId), 0, 6);

        $permalink = $data['permalink_url'] ?? $data['link'] ?? null;

        $this->pdo->beginTransaction();
        try {
            $stmtPost = $this->pdo->prepare('
                INSERT INTO posts (title, slug, body, cover_media_id, status, origin, created_by, published_at, created_at)
                VALUES (:title, :slug, :body, NULL, "published", :origin, :created_by, NOW(), NOW())
            ');

            $stmtPost->execute([
                'title'      => $title,
                'slug'       => $slug,
                'body'       => $message,
                'origin'     => $platform,
                'created_by' => $authorId,
            ]);

            $newPostId = (int)$this->pdo->lastInsertId();

            $stmtLink = $this->pdo->prepare('
                INSERT INTO post_social_links (post_id, platform, external_post_id, external_permalink, sync_status, sync_error, synced_at)
                VALUES (:post_id, :platform, :external_id, :permalink, "synced", NULL, NOW())
            ');

            $stmtLink->execute([
                'post_id'     => $newPostId,
                'platform'    => $platform,
                'external_id' => $externalId,
                'permalink'   => $permalink,
            ]);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            error_log('Error importing social post via webhook: ' . $e->getMessage());
        }
    }
}
