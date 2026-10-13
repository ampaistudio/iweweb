<?php
declare(strict_types=1);
// Integration test: MySQL TEMPORARY tables shadow production names only in this
// connection and disappear at exit. No existing row, session or schema is changed.
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/core/helpers.php';
require_once __DIR__ . '/../api/core/content/ContentController.php';
require_once __DIR__ . '/../api/core/social/MetaGraphService.php';
require_once __DIR__ . '/../api/core/posts/PostsController.php';
require_once __DIR__ . '/../api/core/packages/PackageController.php';
$kind = $argv[1] ?? 'content';
if (!in_array($kind, ['content','post','package'], true)) throw new RuntimeException('Unknown case');
$pdo = Database::getConnection();
if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== 'iwe_dashboard_local') throw new RuntimeException('Local database required');
$tables = ['users','site_content','site_content_translations','posts','post_translations','packages','package_translations','package_content','package_content_translations','package_media','menu_items','menu_item_translations'];
foreach ($tables as $table) {
    $schema = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1];
    $schema = preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $schema);
    $schema = preg_replace('/^\s*CONSTRAINT .*FOREIGN KEY.*\n/m', '', $schema);
    $schema = preg_replace('/,\n\)/', "\n)", $schema);
    $pdo->exec($schema);
}
$hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
$pdo->prepare('INSERT INTO users (id,email,password_hash,display_name,role,must_change_password) VALUES (999,?,?,?,"admin",0)')->execute(['editorial@example.invalid',$hash,'Editorial test']);
$_SESSION = ['user_id'=>999, 'auth_fingerprint'=>hash('sha256',$hash)];
$raw = '<h2>Título</h2><p>Primero <strong>negrita</strong> &amp; segundo</p><ul><li>Elemento</li></ul><script>alert(1)</script>';
$expected = sanitizeRichText($raw);
$_POST = match($kind) {
    'content' => ['content_value'=>$raw,'translations'=>['en'=>$raw]],
    'post' => ['title'=>'Editorial test','body'=>$raw,'status'=>'draft','publish_to_facebook'=>false,'publish_to_instagram'=>false,'translations'=>['en'=>['title'=>'Translation','body'=>$raw]]],
    'package' => ['id'=>'editorial-test','title'=>'Editorial test','duration'=>'2 días','description'=>$raw,'intro_text'=>$raw,'highlights'=>[$raw],'itinerary'=>[$raw],'published'=>false,'translations'=>['en'=>['title'=>'Translation','description'=>$raw,'intro_text'=>$raw,'highlights'=>[$raw],'itinerary'=>[$raw]]]],
};
ob_start();
register_shutdown_function(static function() use ($pdo,$kind,$expected): void {
    $output = ob_get_clean();
    $response = json_decode($output, true);
    try {
        if (!($response['success'] ?? false)) throw new RuntimeException($output ?: 'No response');
        $queries = match($kind) {
            'content' => ['SELECT content_value FROM site_content','SELECT content_value FROM site_content_translations'],
            'post' => ['SELECT body FROM posts','SELECT body FROM post_translations'],
            'package' => ['SELECT description FROM packages','SELECT description FROM package_translations','SELECT intro_text FROM package_content','SELECT intro_text FROM package_content_translations'],
        };
        foreach ($queries as $query) if ($pdo->query($query)->fetchColumn() !== $expected) throw new RuntimeException('Round-trip failed: '.$query);
        if ($kind === 'package') {
            foreach (['package_content','package_content_translations'] as $table) {
                $row=$pdo->query("SELECT highlights_json,itinerary_json FROM $table")->fetch();
                foreach ($row as $json) if (json_decode($json,true) !== [$expected]) throw new RuntimeException('List structure changed');
            }
        }
        echo "PASS $kind: authenticated controller -> temporary MySQL tables -> base and translation preserve safe formatting\n";
    } catch (Throwable $error) { fwrite(STDERR,$error->getMessage()."\n"); exit(1); }
});
match($kind) {
    'content' => (new ContentController($pdo,[]))->update('mission_text'),
    'post' => (new PostsController($pdo,[]))->create(),
    'package' => (new PackageController($pdo,[]))->create(),
};
