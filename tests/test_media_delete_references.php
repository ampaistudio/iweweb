<?php
declare(strict_types=1);

class TestApiStop extends RuntimeException { public int $status; public function __construct(string $message, int $status) { parent::__construct($message); $this->status = $status; } }
function requireAuth(PDO $pdo): array { return ['id' => 1]; }
function jsonError(string $message, int $status = 400): never { throw new TestApiStop($message, $status); }
function jsonSuccess(mixed $data = null, string $message = ''): void {}

require __DIR__ . '/../api/core/media/MediaController.php';
$pdo = class_exists('Pdo\\Sqlite') ? new Pdo\Sqlite('sqlite::memory:') : new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$locate = static function (string $needle, ?string $text): int {
    $position = strpos($text ?? '', $needle);
    return $position === false ? 0 : $position + 1;
};
if (method_exists($pdo, 'createFunction')) {
    $pdo->createFunction('LOCATE', $locate);
} else {
    $pdo->sqliteCreateFunction('LOCATE', $locate);
}
$pdo->exec('CREATE TABLE media (id INTEGER PRIMARY KEY, filename TEXT)');
$pdo->exec('CREATE TABLE posts (id INTEGER, title TEXT, cover_media_id INTEGER, body TEXT)');
$tables = [
    'activities' => ['image_url', 'description', 'intro_text'],
    'activity_images' => ['image_url', 'poster_url'],
    'activity_translations' => ['description', 'intro_text'],
    'hero_slides' => ['src', 'poster'],
    'packages' => ['image_url', 'description'],
    'package_media' => ['media_url', 'poster_url'],
    'package_translations' => ['description'],
    'package_content' => ['intro_text', 'highlights_json', 'itinerary_json'],
    'package_content_translations' => ['intro_text', 'highlights_json', 'itinerary_json'],
    'site_content' => ['content_value'],
    'site_content_translations' => ['content_value'],
    'post_translations' => ['body'],
];
foreach ($tables as $table => $columns) {
    $pdo->exec('CREATE TABLE ' . $table . ' (' . implode(', ', array_map(fn($column) => $column . ' TEXT', $columns)) . ')');
}
$dir = sys_get_temp_dir() . '/iwe-media-delete-' . bin2hex(random_bytes(6));
mkdir($dir, 0700);
$name = 'shared-canary.webp';
file_put_contents($dir . '/' . $name, 'fictitious media');
$pdo->exec("INSERT INTO media VALUES (1, '$name')");
$controller = new MediaController($pdo, ['media' => ['upload_dir' => $dir]]);

foreach ([['package_media', 'poster_url'], ['activity_images', 'poster_url'], ['site_content_translations', 'content_value'], ['package_translations', 'description']] as [$table, $column]) {
    $pdo->exec("INSERT INTO $table ($column) VALUES ('/api/uploads/$name')");
    try {
        $controller->delete(1);
        throw new RuntimeException("Deletion was allowed while $table.$column used the file");
    } catch (TestApiStop $e) {
        if ($e->status !== 409 || !is_file($dir . '/' . $name)) throw $e;
    }
    $pdo->exec("DELETE FROM $table");
}
$controller->delete(1);
if (file_exists($dir . '/' . $name) || $pdo->query('SELECT COUNT(*) FROM media')->fetchColumn() != 0) {
    throw new RuntimeException('Unreferenced media was not removed');
}
rmdir($dir);
echo "PASS referenced files retained; unreferenced file removed\n";
