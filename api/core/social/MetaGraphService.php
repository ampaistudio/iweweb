<?php
/**
 * iWE Dashboard API - Meta Graph API Service
 * 
 * Handles publishing to Facebook Page and connected Instagram Business account.
 * Follows Meta Graph API v21.0 specs with graceful error logging and failure isolation.
 */

class MetaGraphService {
    private array $metaConfig;
    private PDO $pdo;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->metaConfig = $config['meta'] ?? [];
    }

    /**
     * Check if Meta credentials are configured.
     */
    public function isConfigured(): bool {
        return !empty($this->metaConfig['page_id']) && !empty($this->metaConfig['page_access_token']);
    }

    /**
     * Publish post to selected platforms (Facebook / Instagram)
     */
    public function publishPost(int $postId, string $title, string $body, ?string $imageUrl, bool $toFacebook, bool $toInstagram): array {
        $results = [];

        $message = trim($title . "\n\n" . strip_tags($body));

        if ($toFacebook) {
            $results['facebook'] = $this->publishToFacebook($postId, $message, $imageUrl);
        }

        if ($toInstagram) {
            $results['instagram'] = $this->publishToInstagram($postId, $message, $imageUrl);
        }

        return $results;
    }

    /**
     * Publish to Facebook Page (POST /{page-id}/feed or /{page-id}/photos)
     */
    public function publishToFacebook(int $postId, string $message, ?string $imageUrl): array {
        if (!$this->isConfigured()) {
            $error = 'Meta Graph API no configurada (falta META_PAGE_ID o META_PAGE_ACCESS_TOKEN).';
            $this->recordSocialLink($postId, 'facebook', 'unconfigured', null, 'failed', $error);
            return ['status' => 'failed', 'error' => $error];
        }

        $pageId = $this->metaConfig['page_id'];
        $token = $this->metaConfig['page_access_token'];
        $version = $this->metaConfig['api_version'] ?? 'v21.0';

        try {
            if ($imageUrl && filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // Publish photo with caption
                $url = "https://graph.facebook.com/{$version}/{$pageId}/photos";
                $postData = [
                    'url'          => $imageUrl,
                    'message'      => $message,
                    'access_token' => $token,
                ];
            } else {
                // Text post to feed
                $url = "https://graph.facebook.com/{$version}/{$pageId}/feed";
                $postData = [
                    'message'      => $message,
                    'access_token' => $token,
                ];
            }

            $response = $this->makeHttpRequest('POST', $url, $postData);
            
            if (isset($response['id'])) {
                $externalId = (string)$response['id'];
                $permalink = "https://www.facebook.com/{$externalId}";
                $this->recordSocialLink($postId, 'facebook', $externalId, $permalink, 'synced', null);
                return ['status' => 'synced', 'external_post_id' => $externalId, 'permalink' => $permalink];
            }

            $errMsg = $response['error']['message'] ?? 'Error desconocido al publicar en Facebook.';
            $this->recordSocialLink($postId, 'facebook', 'err_' . time(), null, 'failed', $errMsg);
            return ['status' => 'failed', 'error' => $errMsg];

        } catch (Throwable $e) {
            $this->recordSocialLink($postId, 'facebook', 'err_' . time(), null, 'failed', $e->getMessage());
            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    /**
     * Publish to Instagram Business (2-step container flow: create container -> publish)
     */
    public function publishToInstagram(int $postId, string $message, ?string $imageUrl): array {
        $igUserId = $this->metaConfig['ig_user_id'] ?? '';
        $token = $this->metaConfig['page_access_token'] ?? '';
        $version = $this->metaConfig['api_version'] ?? 'v21.0';

        if (empty($igUserId) || empty($token)) {
            $error = 'Instagram Business ID no configurado (falta META_IG_USER_ID o token).';
            $this->recordSocialLink($postId, 'instagram', 'unconfigured', null, 'failed', $error);
            return ['status' => 'failed', 'error' => $error];
        }

        if (empty($imageUrl) || !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            $error = 'Instagram requiere obligatoriamente una imagen con URL pública válida.';
            $this->recordSocialLink($postId, 'instagram', 'invalid_media', null, 'failed', $error);
            return ['status' => 'failed', 'error' => $error];
        }

        try {
            // Step 1: Create media container
            $containerUrl = "https://graph.facebook.com/{$version}/{$igUserId}/media";
            $containerData = [
                'image_url'    => $imageUrl,
                'caption'      => $message,
                'access_token' => $token,
            ];

            $containerRes = $this->makeHttpRequest('POST', $containerUrl, $containerData);

            if (!isset($containerRes['id'])) {
                $errMsg = $containerRes['error']['message'] ?? 'Error al crear contenedor de media en Instagram.';
                $this->recordSocialLink($postId, 'instagram', 'err_' . time(), null, 'failed', $errMsg);
                return ['status' => 'failed', 'error' => $errMsg];
            }

            $creationId = $containerRes['id'];

            // Step 2: Publish media container
            $publishUrl = "https://graph.facebook.com/{$version}/{$igUserId}/media_publish";
            $publishData = [
                'creation_id'  => $creationId,
                'access_token' => $token,
            ];

            $publishRes = $this->makeHttpRequest('POST', $publishUrl, $publishData);

            if (isset($publishRes['id'])) {
                $externalId = (string)$publishRes['id'];
                $permalink = "https://www.instagram.com/p/{$externalId}/";
                $this->recordSocialLink($postId, 'instagram', $externalId, $permalink, 'synced', null);
                return ['status' => 'synced', 'external_post_id' => $externalId, 'permalink' => $permalink];
            }

            $errMsg = $publishRes['error']['message'] ?? 'Error al publicar contenedor en Instagram.';
            $this->recordSocialLink($postId, 'instagram', 'err_' . time(), null, 'failed', $errMsg);
            return ['status' => 'failed', 'error' => $errMsg];

        } catch (Throwable $e) {
            $this->recordSocialLink($postId, 'instagram', 'err_' . time(), null, 'failed', $e->getMessage());
            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    /**
     * Record or update post social link status in the database
     */
    public function recordSocialLink(int $postId, string $platform, string $externalId, ?string $permalink, string $syncStatus, ?string $syncError): void {
        $stmt = $this->pdo->prepare('
            INSERT INTO post_social_links (post_id, platform, external_post_id, external_permalink, sync_status, sync_error, synced_at)
            VALUES (:post_id, :platform, :external_post_id, :permalink, :sync_status, :sync_error, :synced_at)
            ON DUPLICATE KEY UPDATE
                external_post_id   = VALUES(external_post_id),
                external_permalink = VALUES(external_permalink),
                sync_status        = VALUES(sync_status),
                sync_error         = VALUES(sync_error),
                synced_at          = VALUES(synced_at)
        ');

        $stmt->execute([
            'post_id'          => $postId,
            'platform'         => $platform,
            'external_post_id' => $externalId,
            'permalink'        => $permalink,
            'sync_status'      => $syncStatus,
            'sync_error'       => $syncError,
            'synced_at'        => $syncStatus === 'synced' ? date('Y-m-d H:i:s') : null,
        ]);
    }

    /**
     * Execute HTTP request using cURL or file_get_contents
     */
    private function makeHttpRequest(string $method, string $url, array $params = []): array {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            
            if ($method === 'POST') {
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
            } else {
                $query = http_build_query($params);
                curl_setopt($ch, CURLOPT_URL, $url . ($query ? '?' . $query : ''));
            }

            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

            $result = curl_exec($ch);
            $err = curl_error($ch);
            curl_close($ch);

            if ($err) {
                throw new RuntimeException("cURL Error: {$err}");
            }

            return json_decode($result, true) ?: [];
        }

        $opts = [
            'http' => [
                'method'  => $method,
                'timeout' => 15,
                'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            ]
        ];

        if ($method === 'POST') {
            $opts['http']['content'] = http_build_query($params);
            $targetUrl = $url;
        } else {
            $query = http_build_query($params);
            $targetUrl = $url . ($query ? '?' . $query : '');
        }

        $context = stream_context_create($opts);
        $result = @file_get_contents($targetUrl, false, $context);

        if ($result === false) {
            throw new RuntimeException("HTTP request to {$url} failed.");
        }

        return json_decode($result, true) ?: [];
    }
}
