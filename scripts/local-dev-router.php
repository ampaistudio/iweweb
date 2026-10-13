<?php
/**
 * Router script for PHP's built-in dev server (`php -S`) only.
 *
 * The built-in server does not read .htaccess, so it never applies the
 * "serve /api/uploads/* as static files" rule that Apache/LiteSpeed use in
 * production. This script replicates just that one rule for local testing.
 * It is not used in production and is not referenced by any deployed code.
 */
$uri = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

if (preg_match('#(?:^|/)\.\.(?:/|$)|^/api/storage(?:/|$)#i', $uri)) {
    http_response_code(403);
    exit;
}

if (preg_match('#^/api/uploads/#', $uri)) {
    $uploads = realpath(__DIR__ . '/../api/uploads');
    $file = realpath(__DIR__ . '/..' . $uri);
    if ($uploads && $file && str_starts_with($file, $uploads . DIRECTORY_SEPARATOR)
        && is_file($file) && preg_match('/\.(?:jpe?g|png|webp|gif|avif|mp4|webm)$/i', $file)) {
        return false; // let the built-in server serve the static file directly
    }
    http_response_code(404);
    exit;
}

require __DIR__ . '/../api/index.php';
