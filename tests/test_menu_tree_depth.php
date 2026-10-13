<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/core/menu/MenuController.php';

$reflection = new ReflectionClass(MenuController::class);
$controller = $reflection->newInstanceWithoutConstructor();
$buildTree = $reflection->getMethod('buildTree');

$rows = [];
foreach ([
    [90, null, 'Actividades'],
    [7, 90, 'Experiencia Verano'],
    [10, 7, 'Bike'],
    [11, 10, 'E-Bike Forn de Canillo'],
    [25, 90, 'Experiencia Invierno'],
    [26, 25, 'Caminata con raquetas'],
    [27, 26, 'Raquetas nocturnas'],
] as [$id, $parentId, $label]) {
    $rows[] = [
        'id' => $id,
        'parent_id' => $parentId,
        'label' => $label,
        'link_type' => 'anchor',
        'target_value' => '/#activities',
        'display_order' => 1,
        'published' => 1,
        'publish_at' => null,
        'unpublish_at' => null,
        'is_currently_visible' => 1,
        'created_at' => '2026-10-06 00:00:00',
        'updated_at' => '2026-10-06 00:00:00',
    ];
}

$tree = $buildTree->invoke($controller, $rows);
if (count($tree) !== 1 || $tree[0]['label'] !== 'Actividades') throw new RuntimeException('Missing grouped root');
if (count($tree[0]['children']) !== 2) throw new RuntimeException('Missing seasons');
if ($tree[0]['children'][0]['children'][0]['children'][0]['label'] !== 'E-Bike Forn de Canillo') throw new RuntimeException('Summer activity lost');
if ($tree[0]['children'][1]['children'][0]['children'][0]['label'] !== 'Raquetas nocturnas') throw new RuntimeException('Winter activity lost');
echo "PASS: public menu controller preserves four levels\n";
