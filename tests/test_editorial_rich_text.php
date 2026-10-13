<?php
declare(strict_types=1);
require_once __DIR__ . '/../api/core/helpers.php';
require_once __DIR__ . '/../api/core/content/ContentController.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
$raw = '<h2 onclick="alert(1)">Título</h2><p>Texto <strong>claro</strong> &amp; útil</p><ul><li>Uno</li></ul><script>alert(1)</script><img src=x onerror=alert(1)>';
$clean = sanitizeRichText($raw);
check(str_contains($clean, '<h2>Título</h2>'), 'Heading lost');
check(str_contains($clean, '<strong>claro</strong>'), 'Bold lost');
check(!preg_match('/script|onclick|onerror|<img/i', $clean), 'Unsafe markup survived');
check(richTextToPlainText('<p>Primero &amp; segundo</p><p>Tercero<br>Cuarto</p>') === "Primero & segundo\nTercero\nCuarto", 'Social caption lost spacing/entities');
check(sanitizeRichText("Primero\n\nSegundo") === "Primero\n\nSegundo", 'Legacy paragraphs changed');
$reflection = new ReflectionClass(ContentController::class);
$controller = $reflection->newInstanceWithoutConstructor();
$method = $reflection->getMethod('cleanValue');
foreach (['hero_copy','mission_text','team_bio','tours_copy','contact_copy','weather_copy','privacy_policy_text'] as $key) {
    check($method->invoke($controller, $key, $raw) === $clean, 'Content field not sanitized: ' . $key);
}
$reviews = json_decode($method->invoke($controller, 'reviews_direct_items', json_encode([['name'=>'Cliente','quote'=>$raw]])), true);
check($reviews[0]['quote'] === $clean && $reviews[0]['name'] === 'Cliente', 'Review contract changed');
check($method->invoke($controller, 'social_links_json', '{"x":"https://example.invalid"}') === '{"x":"https://example.invalid"}', 'Configuration was rewritten');
echo "PASS editorial formatting, legacy text, social text, CMS fields, reviews and unchanged configuration\n";
