<?php
/**
 * Router script for PHP's built-in dev server (`php -S`) only.
 *
 * The built-in server does not read .htaccess, so it never applies the
 * "serve /api/uploads/* as static files" rule that Apache/LiteSpeed use in
 * production. This script replicates just that one rule for local testing.
 * It is not used in production and is not referenced by any deployed code.
 */
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if (preg_match('#^/api/uploads/#', $uri)) {
    $file = __DIR__ . '/..' . $uri;
    if (is_file($file)) {
        return false; // let the built-in server serve the static file directly
    }
}

require __DIR__ . '/../api/index.php';
