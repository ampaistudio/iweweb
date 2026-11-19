<?php
/**
 * Router script for PHP's built-in dev server (`php -S`) only.
 *
 * The built-in server does not read .htaccess, so it never applies the
 * "serve /api/uploads/* as static files" rule that Apache/LiteSpeed use in
 * production. This script replicates just that one rule for local testing.
 * It is not used in production and is not referenced by any deployed code.
 */
require_once __DIR__ . '/../api/core/PublicFilePolicy.php';
$uri = publicRequestPath($_SERVER['REQUEST_URI'] ?? '/');
rejectPrivateRequest($uri);

if (preg_match('#^/api/uploads/#', $uri)) {
    $file = containedPublicFile(__DIR__ . '/../api/uploads', __DIR__ . '/..' . $uri, dirname(__DIR__), true);
    if ($file !== null && publicAssetExtension($file, true)) {
        return false; // let the built-in server serve the static file directly
    }
    http_response_code(404);
    exit;
}

require __DIR__ . '/../api/index.php';
