<?php
declare(strict_types=1);

function requireAuth(PDO $pdo): array { return ['id' => 1]; }
function getAuthenticatedUser(PDO $pdo): ?array { return null; }
function getRequestBody(): array { return $GLOBALS['requestBody'] ?? []; }
function jsonSuccess($data = null, string $message = '', int $status = 200): void { $GLOBALS['response'] = $data; }
function jsonError(string $message, int $status = 400, array $details = []): void { throw new RuntimeException($status . ': ' . $message); }
require_once __DIR__ . '/../api/core/menu/MenuController.php';

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('PRAGMA foreign_keys = ON');
if (method_exists($pdo, 'createFunction')) {
    $pdo->createFunction('NOW', static fn(): string => '2026-10-06 12:00:00');
} else {
    @$pdo->sqliteCreateFunction('NOW', static fn(): string => '2026-10-06 12:00:00');
}
$pdo->exec('CREATE TABLE menu_items (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE, label TEXT NOT NULL, link_type TEXT NOT NULL, target_value TEXT NOT NULL, display_order INTEGER NOT NULL, published INTEGER NOT NULL, publish_at TEXT, unpublish_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$pdo->exec('CREATE TABLE menu_item_translations (menu_item_id INTEGER, locale TEXT, label TEXT)');
$pdo->exec('CREATE TABLE packages (id TEXT, published INTEGER, publish_at TEXT, unpublish_at TEXT)');
$pdo->exec("INSERT INTO menu_items (id, parent_id, label, link_type, target_value, display_order, published) VALUES
 (90, NULL, 'Actividades', 'anchor', '/#activities', 4, 1),
 (7, 90, 'Experiencia Verano', 'anchor', '/#tours', 1, 1),
 (25, 90, 'Experiencia Invierno', 'anchor', '/#esqui-snow', 2, 1),
 (10, 7, 'Bike', 'anchor', '/#bike', 3, 1),
 (11, 10, 'Forn de Canillo', 'activity', 'ebike-forn-canillo', 1, 1)");
$pdo->exec("INSERT INTO menu_item_translations VALUES (90, 'en', 'Activities')");
$controller = new MenuController($pdo, []);

function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function row(PDO $pdo, int $id): array {
    $stmt = $pdo->prepare('SELECT * FROM menu_items WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

$GLOBALS['requestBody'] = [
    'label' => 'Experiencias de verano', 'link_type' => 'anchor', 'target_value' => '/#tours',
    'parent_id' => 90, 'published' => 1,
];
$controller->update(7);
check(row($pdo, 7)['label'] === 'Experiencias de verano', 'Editing label failed');
check((int)row($pdo, 7)['parent_id'] === 90, 'Editing label moved the season');
check((int)row($pdo, 7)['display_order'] === 1, 'Editing label reset the order');
check((int)row($pdo, 10)['parent_id'] === 7, 'Editing season moved category');
check((int)row($pdo, 11)['parent_id'] === 10, 'Editing season moved activity');

try {
    $controller->delete(90);
    throw new RuntimeException('Group deletion unexpectedly succeeded');
} catch (RuntimeException $error) {
    check(str_starts_with($error->getMessage(), '409:'), 'Group deletion did not return 409');
}
check((int)$pdo->query('SELECT COUNT(*) FROM menu_items')->fetchColumn() === 5, 'Group deletion cascaded to descendants');

$GLOBALS['requestBody'] = ['items' => [['id' => 90, 'parent_id' => 11, 'display_order' => 1]]];
try {
    $controller->reorder();
    throw new RuntimeException('Circular reorder unexpectedly succeeded');
} catch (RuntimeException $error) {
    check(str_starts_with($error->getMessage(), '422:'), 'Circular reorder did not return 422');
}
check(row($pdo, 90)['parent_id'] === null, 'Circular reorder changed the root');

$GLOBALS['requestBody'] = [
    'label' => 'Experiencia Invierno', 'link_type' => 'anchor', 'target_value' => '/#esqui-snow',
    'parent_id' => 90, 'published' => 0, 'display_order' => 2,
];
$controller->update(25);
check((int)row($pdo, 25)['published'] === 0, 'Winter publish toggle failed');
check((int)row($pdo, 7)['published'] === 1, 'Winter toggle changed Summer');

$_GET = ['locale' => 'en'];
$controller->list();
$tree = $GLOBALS['response'];
check(count($tree) === 1 && $tree[0]['label'] === 'Activities', 'Localized group missing');
check(count($tree[0]['children']) === 1, 'Hidden season visible or Summer missing');
check($tree[0]['children'][0]['children'][0]['children'][0]['target_value'] === 'ebike-forn-canillo', 'Nested activity lost');

echo "PASS: edit preserves order and descendants, group deletion and circular reorder blocked, seasons publish independently, public tree and translation intact\n";
