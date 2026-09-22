<?php
/**
 * iWE Web & Admin Panel - Front Controller & Dynamic Router
 * 
 * Maps the secret panel slug dynamically from configuration to the
 * generic admin-panel/ directory without hardcoding secrets in Git.
 * Also handles SPA fallbacks and local development with php -S.
 */

declare(strict_types=1);

// CLI Server (php -S) static file pass-through & routing
if (php_sapi_name() === 'cli-server') {
    $rawUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    
    // Block direct access to physical admin-panel folder
    if (str_starts_with($rawUri, '/admin-panel')) {
        http_response_code(403);
        echo 'Access Forbidden';
        exit;
    }

    // Pass existing static files (except PHP files)
    $staticFile = __DIR__ . $rawUri;
    if ($rawUri !== '/' && is_file($staticFile) && !str_ends_with($rawUri, '.php')) {
        return false;
    }

    // Delegate /api requests to api/index.php
    if (str_starts_with($rawUri, '/api')) {
        require __DIR__ . '/api/index.php';
        exit;
    }
}

// Block direct access to physical admin-panel folder (defense-in-depth)
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
if (str_starts_with($requestUri, '/admin-panel')) {
    http_response_code(403);
    echo 'Access Forbidden';
    exit;
}

// Load application configuration
$config = require __DIR__ . '/api/config/config.php';
$panelSlug = trim((string)($config['app']['panel_slug'] ?? ''), '/');
$panelDir = trim((string)($config['app']['panel_dir'] ?? 'admin-panel'), '/');

$path = '/' . trim($requestUri, '/');
$segments = array_values(array_filter(explode('/', $path)));
$firstSegment = $segments[0] ?? '';

// Check if request matches the dynamically configured secret panel slug
if ($panelSlug !== '' && $firstSegment === $panelSlug) {
    $subpath = implode('/', array_slice($segments, 1));
    $distDir = __DIR__ . '/' . $panelDir . '/dist';

    // 1. If requesting a static asset under /<slug>/...
    if ($subpath !== '') {
        $candidateFile = $distDir . '/' . $subpath;
        $realCandidate = realpath($candidateFile);
        $realDist = realpath($distDir);

        if ($realCandidate !== false && $realDist !== false && str_starts_with($realCandidate, $realDist) && is_file($realCandidate)) {
            serveStaticAsset($realCandidate);
            exit;
        }
    }

    // 2. Otherwise serve admin panel SPA index.html with dynamically injected base
    $panelIndex = $distDir . '/index.html';
    if (!file_exists($panelIndex)) {
        $panelIndex = __DIR__ . '/' . $panelDir . '/index.html';
    }

    if (file_exists($panelIndex)) {
        $html = file_get_contents($panelIndex);

        $baseTag = '<base href="/' . htmlspecialchars($panelSlug, ENT_QUOTES, 'UTF-8') . '/" id="app-base" />';
        $scriptTag = '<script>window.__PANEL_BASENAME__ = "/' . htmlspecialchars($panelSlug, ENT_QUOTES, 'UTF-8') . '";</script>';

        if (str_contains($html, '<base href="/" id="app-base" />')) {
            $html = str_replace('<base href="/" id="app-base" />', $baseTag . "\n    " . $scriptTag, $html);
        } elseif (str_contains($html, '<head>')) {
            $html = str_replace('<head>', "<head>\n    " . $baseTag . "\n    " . $scriptTag, $html);
        }

        header('Content-Type: text/html; charset=UTF-8');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo $html;
        exit;
    }

    http_response_code(503);
    echo 'Admin Panel not built. Run "npm run build" inside ' . htmlspecialchars($panelDir, ENT_QUOTES, 'UTF-8') . '.';
    exit;
}

// Main Website SPA Fallback
$mainIndex = __DIR__ . '/index.html';
if (file_exists($mainIndex)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($mainIndex);
    exit;
}

http_response_code(404);
echo 'Not Found';
exit;

/**
 * Helper to serve compiled static assets with appropriate Content-Type and caching
 */
function serveStaticAsset(string $filePath): void {
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimes = [
        'js'   => 'application/javascript; charset=UTF-8',
        'mjs'  => 'application/javascript; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'json' => 'application/json; charset=UTF-8',
    ];

    $mime = $mimes[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');

    if (str_contains($filePath, '/assets/')) {
        header('Cache-Control: public, max-age=31536000, immutable');
    } else {
        header('Cache-Control: public, max-age=3600');
    }

    header('Content-Length: ' . (string)filesize($filePath));
    readfile($filePath);
}
