<?php
/** Read-only media reference inventory for the local iWE database. */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit(1);
}

$config = require __DIR__ . '/../api/config/config.php';
if (($config['db']['database'] ?? '') !== 'iwe_dashboard_local') {
    fwrite(STDERR, "Use only DB_NAME=iwe_dashboard_local.\n");
    exit(1);
}
require_once __DIR__ . '/../api/config/database.php';
$pdo = Database::getConnection($config['db']);
$uploadDir = realpath(__DIR__ . '/../api/uploads');
if ($uploadDir === false) {
    fwrite(STDERR, "api/uploads is unavailable.\n");
    exit(1);
}

$fields = [
    'activities' => ['image_url', 'description', 'intro_text'],
    'activity_images' => ['image_url', 'poster_url'],
    'hero_slides' => ['src', 'poster'],
    'packages' => ['image_url', 'description'],
    'package_translations' => ['description'],
    'package_media' => ['media_url', 'poster_url'],
    'site_content' => ['content_value'],
    'site_content_translations' => ['content_value'],
    'posts' => ['body'],
    'post_translations' => ['body'],
    'package_content' => ['intro_text', 'highlights_json', 'itinerary_json'],
    'package_content_translations' => ['intro_text', 'highlights_json', 'itinerary_json'],
    'activity_translations' => ['description', 'intro_text'],
];
$directFields = ['image_url', 'poster_url', 'src', 'poster', 'media_url'];
$report = ['database' => 'iwe_dashboard_local', 'references' => [], 'media_inventory' => []];

foreach ($fields as $table => $columns) {
    foreach ($columns as $column) {
        $values = $pdo->query("SELECT `$column` FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($values as $raw) {
            if (!is_string($raw) || trim($raw) === '') continue;
            $raw = str_replace('\\/', '/', $raw);
            $urls = [];
            if (in_array($column, $directFields, true)) {
                $urls[] = trim($raw);
            } else {
                preg_match_all('~(?:https?://[^\s"\'<>]+?\.(?:jpe?g|png|webp|gif|avif|svg)(?:\?[^\s"\'<>]*)?|/api/uploads/[a-zA-Z0-9._-]+)~i', $raw, $matches);
                $urls = $matches[0];
            }
            foreach ($urls as $url) {
                $path = parse_url($url, PHP_URL_PATH) ?: $url;
                if (str_starts_with($path, '/api/uploads/')) {
                    $filename = rawurldecode(substr($path, strlen('/api/uploads/')));
                    $local = !str_contains($filename, '/') && $filename !== '.' && $filename !== '..';
                    $filePath = $local ? $uploadDir . '/' . $filename : '';
                    $report['references'][] = [
                        'source' => "$table.$column",
                        'kind' => 'local',
                        'url' => $url,
                        'exists' => $local && is_file($filePath),
                        'image_valid' => $local && is_file($filePath) ? getimagesize($filePath) !== false : false,
                    ];
                } else {
                    $report['references'][] = ['source' => "$table.$column", 'kind' => 'external', 'url' => $url];
                }
            }
        }
    }
}

foreach ($pdo->query('SELECT filename FROM media') as $row) {
    $filename = (string)$row['filename'];
    $report['media_inventory'][] = ['filename' => $filename, 'exists' => is_file($uploadDir . '/' . $filename)];
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n";
