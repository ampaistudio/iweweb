<?php
declare(strict_types=1);

/** HTTP file boundary shared by the PHP development routers. */
function publicRequestPath(string $requestUri): string {
    $path = rawurldecode(parse_url($requestUri, PHP_URL_PATH) ?: '/');
    if (preg_match('#[\\x00-\\x1f\\x7f\\\\\\\\]|(?:^|/)\\.{1,2}(?:/|$)|%#', $path)) {
        http_response_code(403);
        exit;
    }
    return '/' . ltrim($path, '/');
}

function rejectPrivateRequest(string $path): void {
    $private = '#(?:^|/)\\.(?!well-known(?:/|$))|^/(?:admin-panel|src|tests|scripts|node_modules|content|dist|graphify-out)(?:/|$)|^/api/(?:config|core|migrations|scripts|storage)(?:/|$)#i';
    $sensitive = '#\\.(?:sql|sqlite3?|db|log|ini|env|bak|old|orig|save|swp|lock|map|ts|tsx|py|sh)(?:/|$)|^/(?:package(?:-lock)?\\.json|composer\.(?:json|lock)|tsconfig\.json)$#i';
    if (preg_match($private, $path) || preg_match($sensitive, $path)
        || (preg_match('#\\.(?:php[0-9]?|phtml|phar)(?:/|$)#i', $path) && !in_array($path, ['/index.php', '/api/index.php'], true))) {
        http_response_code(403);
        exit;
    }
}

function publicAssetExtension(string $path, bool $mediaOnly = false): bool {
    $extensions = $mediaOnly ? 'jpe?g|png|webp|gif|avif|mp4|webm' : 'js|mjs|css|svg|jpe?g|png|webp|gif|avif|ico|woff2?|ttf|mp4|webm';
    return (bool)preg_match('#\\.(?:' . $extensions . ')$#i', $path);
}

function containedPublicFile(string $directory, string $candidate, string $siteRoot, bool $mediaOnly = false): ?string {
    $base = realpath($directory);
    $file = realpath($candidate);
    $root = realpath($siteRoot);
    if ($base === false || $file === false || $root === false || !is_file($file)
        || !str_starts_with($base, $root . DIRECTORY_SEPARATOR)
        || !str_starts_with($file, $base . DIRECTORY_SEPARATOR)) return null;
    $relative = substr($file, strlen($base) + 1);
    if (preg_match('#(?:^|/)\.#', $relative) || !publicAssetExtension($file, $mediaOnly)) return null;
    return $file;
}
