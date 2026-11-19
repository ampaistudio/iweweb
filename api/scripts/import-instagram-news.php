<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/helpers.php';
require_once __DIR__ . '/../core/social/MetaGraphService.php';
require_once __DIR__ . '/../core/social/SocialPostImporter.php';

try {
    $options = getopt('', ['since:', 'apply']);
    $since = $options['since'] ?? null;
    $cutoff = is_string($since) ? DateTimeImmutable::createFromFormat('!Y-m-d', $since, new DateTimeZone('UTC')) : false;
    if (!$cutoff || $cutoff->format('Y-m-d') !== $since) {
        throw new InvalidArgumentException('Indicá --since=AAAA-MM-DD. Agregá --apply para importar.');
    }

    $config = require __DIR__ . '/../config/config.php';
    if (empty($config['meta']['ig_user_id']) || empty($config['meta']['page_access_token'])) {
        throw new RuntimeException('Configurá en el servidor la cuenta profesional de Instagram y el acceso de Meta.');
    }

    $pdo = Database::getConnection($config['db']);
    $meta = new MetaGraphService($pdo, $config);
    $importer = new SocialPostImporter($pdo);
    $seen = 0;
    $added = 0;
    foreach ($meta->instagramPublications() as $media) {
        if (empty($media['timestamp']) || empty($media['id'])) {
            continue;
        }

        $publishedAt = new DateTimeImmutable($media['timestamp']);
        if ($publishedAt < $cutoff) {
            break;
        }

        $seen++;
        if (isset($options['apply']) && $importer->import(
            'instagram', (string)$media['id'], (string)($media['caption'] ?? ''), $media['permalink'] ?? null, $publishedAt
        )) {
            $added++;
        }
    }

    printf("%s. Publicaciones elegibles: %d. Novedades nuevas: %d.\n", isset($options['apply']) ? 'Importación' : 'Vista previa', $seen, $added);
} catch (Throwable $e) {
    fwrite(STDERR, $e instanceof InvalidArgumentException ? $e->getMessage() . PHP_EOL : "No se pudo completar la consulta a Instagram. Revisá la cuenta, el acceso de Meta y la conexión a la base de datos.\n");
    exit(1);
}
