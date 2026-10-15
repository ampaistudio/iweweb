<?php
declare(strict_types=1);
require __DIR__ . '/../api/core/health/SiteHealthController.php';

$pdo = new PDO('sqlite::memory:');
$private = sys_get_temp_dir() . '/iwe-private-backup-test-' . bin2hex(random_bytes(6));
$_SERVER['DOCUMENT_ROOT'] = dirname(__DIR__);
$config = ['storage' => ['backups_dir' => $private], 'app' => ['panel_dir' => 'admin-panel']];
new SiteHealthController($pdo, $config);
if (!is_dir($private)) throw new RuntimeException('Private directory was not prepared');

$config['storage']['backups_dir'] = __DIR__ . '/../api/storage/backups';
try {
    new SiteHealthController($pdo, $config);
    throw new RuntimeException('Public backup directory was accepted');
} catch (RuntimeException $e) {
    if (!str_contains($e->getMessage(), 'fuera del sitio público')) throw $e;
}
rmdir($private);
echo "PASS private path accepted; public path rejected\n";
