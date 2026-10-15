<?php
declare(strict_types=1);
require __DIR__ . '/../api/core/auth/AuthRateLimiter.php';

$dir = sys_get_temp_dir() . '/iwe-rate-test-' . bin2hex(random_bytes(6));
$_SERVER['DOCUMENT_ROOT'] = dirname(__DIR__);
$limiter = new AuthRateLimiter($dir);
if (!$limiter->consume('login', '203.0.113.1', 2, 900)
    || !$limiter->consume('login', '203.0.113.1', 2, 900)
    || $limiter->consume('login', '203.0.113.1', 2, 900)
    || !$limiter->consume('login', '203.0.113.2', 2, 900)) {
    throw new RuntimeException('Throttle did not separate clients or reject excess attempts');
}
$files = glob($dir . '/*.json');
if (count($files) !== 2 || str_contains(file_get_contents($files[0]), '203.0.113.')) {
    throw new RuntimeException('Throttle files leaked client identifiers');
}
foreach ($files as $file) unlink($file);
rmdir($dir);
echo "PASS repeated attempts throttled; separate client allowed; identifiers hashed\n";
