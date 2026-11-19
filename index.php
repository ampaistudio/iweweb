<?php
/**
 * iWE Web & Admin Panel - Front Controller & Dynamic Router
 * 
 * Maps the secret panel slug dynamically from configuration to the
 * generic admin-panel/ directory without hardcoding secrets in Git.
 * Also handles SPA fallbacks and local development with php -S.
 */

declare(strict_types=1);

require_once __DIR__ . '/api/core/PublicFilePolicy.php';
$requestUri = publicRequestPath($_SERVER['REQUEST_URI'] ?? '/');
rejectPrivateRequest($requestUri);

// An opt-in loopback preview serves the release selected by the local worker.
$releaseRoot = __DIR__;
$webRoot = __DIR__;
if (PHP_SAPI === 'cli-server' && getenv('IWE_LOCAL_RELEASES') === '1'
    && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    require_once __DIR__ . '/api/core/health/LocalMaintenance.php';
    $private = realpath(LocalMaintenance::directory());
    $active = realpath($private . '/active');
    if ($active !== false && dirname($active) === $private && str_starts_with(basename($active), 'release-')) {
        $releaseRoot = $active;
    }
    $webRoot = $releaseRoot . '/dist';
}

// Use the same file containment checks under PHP's server and Apache.
$staticFile = null;
if (in_array($requestUri, ['/index.html', '/robots.txt', '/favicon.ico'], true)) {
    $candidate = realpath($webRoot . $requestUri);
    if ($candidate !== false && $candidate === $webRoot . $requestUri && is_file($candidate)) $staticFile = $candidate;
} elseif (str_starts_with($requestUri, '/assets/')) {
    if (publicAssetExtension($requestUri)) $staticFile = containedPublicFile($webRoot . '/assets', $webRoot . $requestUri, $releaseRoot);
    if ($staticFile === null) { http_response_code(404); exit; }
} elseif (str_starts_with($requestUri, '/api/uploads/')) {
    if (publicAssetExtension($requestUri, true)) $staticFile = containedPublicFile(__DIR__ . '/api/uploads', __DIR__ . $requestUri, __DIR__, true);
    if ($staticFile === null) { http_response_code(404); exit; }
}
if ($staticFile !== null) {
    serveStaticAsset($staticFile);
    exit;
}
if ($requestUri === '/api' || str_starts_with($requestUri, '/api/')) {
    require __DIR__ . '/api/index.php';
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
    $distDir = $releaseRoot . '/' . $panelDir . '/dist';

    // 1. If requesting a static asset under /<slug>/...
    if ($subpath !== '') {
        $candidateFile = $distDir . '/' . $subpath;
        $realCandidate = containedPublicFile($distDir, $candidateFile, $releaseRoot);

        if ($realCandidate !== null) {
            serveStaticAsset($realCandidate);
            exit;
        }
    }

    if ($subpath !== '' && pathinfo($subpath, PATHINFO_EXTENSION) !== '') {
        http_response_code(404);
        exit;
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
$mainIndex = $webRoot . '/index.html';
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
        'gif' => 'image/gif',
        'avif' => 'image/avif',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'html' => 'text/html; charset=UTF-8',
        'txt' => 'text/plain; charset=UTF-8',
    ];

    $mime = $mimes[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');

    if (str_contains($filePath, '/assets/')) {
        header('Cache-Control: public, max-age=31536000, immutable');
    } else {
        header('Cache-Control: public, max-age=3600');
    }

    // Preserve browser video seeking when media passes through this boundary.
    $size = filesize($filePath);
    $start = 0;
    $end = $size - 1;
    header('Accept-Ranges: bytes');
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    if ($range !== '' && preg_match('/^bytes=(\d*)-(\d*)$/D', $range, $match)) {
        if ($match[1] === '' && $match[2] !== '') {
            $start = max(0, $size - (int)$match[2]);
        } else {
            $start = (int)$match[1];
            $end = $match[2] !== '' ? min($end, (int)$match[2]) : $end;
        }
        if ($size === 0 || $start > $end || ($match[1] === '' && $match[2] === '')) {
            http_response_code(416);
            header('Content-Range: bytes */' . $size);
            header('Content-Length: 0');
            return;
        }
        http_response_code(206);
        header("Content-Range: bytes {$start}-{$end}/{$size}");
    }
    $remaining = max(0, $end - $start + 1);
    header('Content-Length: ' . $remaining);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') return;
    $stream = fopen($filePath, 'rb');
    if ($stream === false) return;
    try {
        fseek($stream, $start);
        while ($remaining > 0 && !feof($stream)) {
            $chunk = fread($stream, min(65536, $remaining));
            if ($chunk === false || $chunk === '') break;
            echo $chunk;
            $remaining -= strlen($chunk);
        }
    } finally {
        fclose($stream);
    }
}
