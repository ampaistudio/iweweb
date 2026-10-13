<?php
declare(strict_types=1);

// Exercise the real controller against an isolated schema with the production FK rule.
function requireAuth(PDO $pdo): array { return ['id' => 1]; }
function getRequestBody(): array { return $GLOBALS['requestBody']; }
function jsonSuccess($data = null, string $message = ''): void { $GLOBALS['response'] = $data; }
function jsonError(string $message, int $status = 400): void { throw new RuntimeException($status . ': ' . $message); }
function slugify(string $text): string {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    return strtolower($text);
}

require_once __DIR__ . '/../api/activities/ActivityTypeController.php';
require_once __DIR__ . '/../api/core/content/ContentController.php';

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');
$pdo->exec('CREATE TABLE activity_types (id INTEGER PRIMARY KEY, name TEXT UNIQUE, display_order INTEGER)');
$pdo->exec('CREATE TABLE activities (id TEXT PRIMARY KEY, type TEXT)');
$pdo->exec('CREATE TABLE site_content (content_key TEXT PRIMARY KEY, content_value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$pdo->exec('CREATE TABLE site_content_translations (id INTEGER PRIMARY KEY, content_key TEXT NOT NULL, locale TEXT NOT NULL, content_value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(content_key) REFERENCES site_content(content_key) ON DELETE CASCADE, UNIQUE(content_key, locale))');
$pdo->exec('CREATE TABLE menu_items (id INTEGER PRIMARY KEY, link_type TEXT NOT NULL, target_value TEXT NOT NULL)');
$pdo->exec("INSERT INTO activity_types VALUES (1, 'Kayak', 1), (7, 'BTT', 2)");
$pdo->exec("INSERT INTO activities VALUES ('tour-1', 'BTT')");
$pdo->exec("INSERT INTO site_content (content_key, content_value) VALUES ('activities_btt_title', 'BTT actual'), ('activities_btt_eyebrow', 'Montaña'), ('activities_bike_title', 'Bike antiguo'), ('activities_bike_image', '/api/uploads/bike.webp'), ('activitiesXbttYother_eyebrow', 'Canario')");
$pdo->exec("INSERT INTO site_content_translations (content_key, locale, content_value) VALUES ('activities_btt_title', 'en', 'Current BTT'), ('activities_bike_image', 'en', '/api/uploads/bike.webp')");
$pdo->exec("INSERT INTO menu_items VALUES (1, 'anchor', '/#bike'), (2, 'anchor', '/#btt'), (3, 'anchor', '/#kayak')");
$controller = new ActivityTypeController($pdo, []);

function value(PDO $pdo, string $sql): mixed { return $pdo->query($sql)->fetchColumn(); }
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }

$GLOBALS['requestBody'] = ['name' => 'Montaña'];
$controller->update(7);
check(value($pdo, "SELECT name FROM activity_types WHERE id = 7") === 'Montaña', 'Category not renamed');
check(value($pdo, "SELECT type FROM activities WHERE id = 'tour-1'") === 'Montaña', 'Activity not renamed');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_montana_title'") === 'BTT actual', 'Current CMS value lost');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_montana_image'") === '/api/uploads/bike.webp', 'Legacy image not copied');
check(value($pdo, "SELECT content_value FROM site_content_translations WHERE content_key = 'activities_montana_title' AND locale = 'en'") === 'Current BTT', 'Translation not copied');
check(value($pdo, "SELECT content_value FROM site_content_translations WHERE content_key = 'activities_montana_image' AND locale = 'en'") === '/api/uploads/bike.webp', 'Legacy translation not copied');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_btt_title'") === 'BTT actual', 'Old content deleted');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_bike_title'") === 'Bike antiguo', 'Legacy content deleted');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activitiesXbttYother_eyebrow'") === 'Canario', 'Unrelated key changed');
check(value($pdo, "SELECT target_value FROM menu_items WHERE id = 1") === '/#category-7', 'Menu link not stabilized');
check(value($pdo, "SELECT target_value FROM menu_items WHERE id = 3") === '/#kayak', 'Unrelated menu link changed');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'footer_featured_activity_type_id'") === '7', 'Featured category assumes ID 1');
$aliases = json_decode((string)value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activity_type_7_anchor_aliases'"), true);
check(in_array('bike', $aliases, true) && in_array('btt', $aliases, true), 'Historical anchors not saved');

// Verify that the real public content endpoint exposes the metadata consumed by the frontend.
$_GET['locale'] = 'es';
$contentController = new ContentController($pdo, []);
$contentController->list();
$publicContent = $GLOBALS['response']['content'] ?? [];
check(($publicContent['footer_featured_activity_type_id'] ?? null) === '7', 'Public content endpoint hid featured category metadata');
$publicAliases = json_decode((string)($publicContent['activity_type_7_anchor_aliases'] ?? ''), true);
check(is_array($publicAliases) && in_array('bike', $publicAliases, true), 'Public content endpoint hid historical anchors');

$GLOBALS['requestBody'] = ['name' => 'Descenso'];
$controller->update(7);
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_descenso_title'") === 'BTT actual', 'Second rename lost CMS content');
$aliases = json_decode((string)value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activity_type_7_anchor_aliases'"), true);
check(in_array('montana', $aliases, true), 'Second rename lost intermediate anchor');

$pdo->exec("INSERT INTO site_content (content_key, content_value) VALUES ('activities_conflicto_title', 'Different content')");
$GLOBALS['requestBody'] = ['name' => 'Conflicto'];
try {
    $controller->update(7);
    throw new RuntimeException('Conflicting rename unexpectedly succeeded');
} catch (RuntimeException $error) {
    check(str_starts_with($error->getMessage(), '409:'), 'Conflict did not produce 409');
}
check(value($pdo, "SELECT name FROM activity_types WHERE id = 7") === 'Descenso', 'Conflict did not roll back category');
check(value($pdo, "SELECT type FROM activities WHERE id = 'tour-1'") === 'Descenso', 'Conflict did not roll back activity');
check(value($pdo, "SELECT content_value FROM site_content WHERE content_key = 'activities_conflicto_title'") === 'Different content', 'Conflict overwrote existing content');

$pdo->exec("INSERT INTO site_content (content_key, content_value) VALUES ('activities_traducido_title', 'BTT actual')");
$pdo->exec("INSERT INTO site_content_translations (content_key, locale, content_value) VALUES ('activities_traducido_title', 'en', 'Different translation')");
$GLOBALS['requestBody'] = ['name' => 'Traducido'];
try {
    $controller->update(7);
    throw new RuntimeException('Translation conflict unexpectedly succeeded');
} catch (RuntimeException $error) {
    check(str_starts_with($error->getMessage(), '409:'), 'Translation conflict did not produce 409');
}
check(value($pdo, "SELECT name FROM activity_types WHERE id = 7") === 'Descenso', 'Translation conflict did not roll back category');
check(value($pdo, "SELECT content_value FROM site_content_translations WHERE content_key = 'activities_traducido_title' AND locale = 'en'") === 'Different translation', 'Translation conflict overwrote content');

echo "PASS: actual controller, FK, legacy keys, arbitrary ID/name, historical anchors, second rename and rollback\n";
