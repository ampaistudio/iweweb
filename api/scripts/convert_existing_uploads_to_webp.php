<?php
/**
 * iWE Web Maintenance Script - Migrate Existing Uploads to WebP Format
 *
 * Scans api/uploads/ and the media database table for non-WebP image uploads (PNG, JPG, JPEG),
 * converts them to WebP using MediaController::optimizeToWebp(), updates all DB references
 * across media, activities, activity_images, hero_slides, packages, and site_content tables,
 * and safely removes original files after verification.
 */

declare(strict_types=1);

// Prevent web access
if (php_sapi_name() !== 'cli' && empty($_SERVER['argv'])) {
    header('HTTP/1.1 403 Forbidden');
    echo 'Este script solo puede ser ejecutado desde la línea de comandos (CLI).';
    exit(1);
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/media/MediaController.php';

$config = require __DIR__ . '/../config/config.php';
$pdo = Database::getConnection($config['db']);

$uploadDir = rtrim($config['media']['upload_dir'] ?? (__DIR__ . '/../uploads'), '/');

echo "========================================================\n";
echo "iWE Web - Migración de Imágenes Existentes a WebP\n";
echo "========================================================\n";
echo "Directorio de uploads: {$uploadDir}\n";
echo "Fecha y Hora: " . date('Y-m-d H:i:s') . "\n\n";

if (!is_dir($uploadDir)) {
    echo "[FATAL] El directorio {$uploadDir} no existe.\n";
    exit(1);
}

// 1. Collect non-webp filenames from database media table
$dbMediaStmt = $pdo->query("SELECT id, filename, mime_type, size_bytes FROM media WHERE filename NOT LIKE '%.webp'");
$dbMediaRows = $dbMediaStmt->fetchAll();

$filesToProcess = [];

foreach ($dbMediaRows as $row) {
    $fn = $row['filename'];
    $filesToProcess[$fn] = [
        'filename'  => $fn,
        'mime_type' => $row['mime_type'],
        'in_db'     => true,
    ];
}

// 2. Collect physical files in uploads dir not yet in map
$dirEntries = scandir($uploadDir);
if ($dirEntries !== false) {
    foreach ($dirEntries as $entry) {
        if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) {
            continue;
        }
        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png'], true) && !isset($filesToProcess[$entry])) {
            $filesToProcess[$entry] = [
                'filename'  => $entry,
                'mime_type' => $ext === 'png' ? 'image/png' : 'image/jpeg',
                'in_db'     => false,
            ];
        }
    }
}

$totalCandidates = count($filesToProcess);
echo "Encontrados {$totalCandidates} archivos candidatos a migrar a WebP.\n\n";

if ($totalCandidates === 0) {
    echo "No hay imágenes pendientes de optimización.\n";
    exit(0);
}

$stats = [
    'total_candidates'  => $totalCandidates,
    'success_count'     => 0,
    'skip_count'        => 0,
    'fail_count'        => 0,
    'total_size_before' => 0,
    'total_size_after'  => 0,
    'errors'            => [],
];

foreach ($filesToProcess as $item) {
    $oldFilename = $item['filename'];
    $sourcePath = $uploadDir . '/' . $oldFilename;

    if (!file_exists($sourcePath)) {
        $stats['fail_count']++;
        $stats['errors'][] = "[ERROR] Archivo no existe en disco: {$oldFilename}";
        echo "❌ [NO ENCONTRADO] {$oldFilename}\n";
        continue;
    }

    $mime = $item['mime_type'];
    if (empty($mime) || $mime === 'application/octet-stream') {
        $detectedMime = @mime_content_type($sourcePath);
        if ($detectedMime) {
            $mime = $detectedMime;
        }
    }

    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        $stats['skip_count']++;
        echo "⏭️ [IGNORADO - Formato no soportado] {$oldFilename} ({$mime})\n";
        continue;
    }

    $ext = strtolower(pathinfo($oldFilename, PATHINFO_EXTENSION));
    $basenameNoExt = pathinfo($oldFilename, PATHINFO_FILENAME);
    $webpFilename = $basenameNoExt . '.webp';
    $webpPath = $uploadDir . '/' . $webpFilename;

    $sizeBefore = filesize($sourcePath);

    // If webp already exists and source equals webp (edge case), skip
    if ($oldFilename === $webpFilename) {
        $stats['skip_count']++;
        continue;
    }

    // Perform WebP conversion using MediaController::optimizeToWebp
    $converted = MediaController::optimizeToWebp($sourcePath, $webpPath, $mime, 1920, 1920, 85);

    if (!$converted || !file_exists($webpPath) || filesize($webpPath) === 0) {
        $stats['fail_count']++;
        $stats['errors'][] = "[FAIL] Error al convertir imagen a WebP: {$oldFilename}";
        echo "❌ [FALLO CONVERSIÓN] {$oldFilename}\n";
        continue;
    }

    $sizeAfter = filesize($webpPath);

    // Update DB references inside transaction
    $pdo->beginTransaction();
    try {
        // 1. Update media table
        $stmtMedia = $pdo->prepare('
            UPDATE media 
            SET filename = ?, mime_type = "image/webp", size_bytes = ? 
            WHERE filename = ?
        ');
        $stmtMedia->execute([$webpFilename, $sizeAfter, $oldFilename]);

        // 2. Update activities table
        $stmtAct = $pdo->prepare('
            UPDATE activities 
            SET image_url = REPLACE(image_url, ?, ?) 
            WHERE image_url LIKE CONCAT("%", ?)
        ');
        $stmtAct->execute([$oldFilename, $webpFilename, $oldFilename]);

        // 3. Update activity_images table
        $stmtActImg = $pdo->prepare('
            UPDATE activity_images 
            SET image_url = REPLACE(image_url, ?, ?) 
            WHERE image_url LIKE CONCAT("%", ?)
        ');
        $stmtActImg->execute([$oldFilename, $webpFilename, $oldFilename]);

        // 4. Update hero_slides table (src and poster)
        $stmtHeroSrc = $pdo->prepare('
            UPDATE hero_slides 
            SET src = REPLACE(src, ?, ?) 
            WHERE src LIKE CONCAT("%", ?)
        ');
        $stmtHeroSrc->execute([$oldFilename, $webpFilename, $oldFilename]);

        $stmtHeroPoster = $pdo->prepare('
            UPDATE hero_slides 
            SET poster = REPLACE(poster, ?, ?) 
            WHERE poster LIKE CONCAT("%", ?)
        ');
        $stmtHeroPoster->execute([$oldFilename, $webpFilename, $oldFilename]);

        // 5. Update packages table
        $stmtPkg = $pdo->prepare('
            UPDATE packages 
            SET image_url = REPLACE(image_url, ?, ?) 
            WHERE image_url LIKE CONCAT("%", ?)
        ');
        $stmtPkg->execute([$oldFilename, $webpFilename, $oldFilename]);

        // 6. Update site_content table
        $stmtContent = $pdo->prepare('
            UPDATE site_content 
            SET content_value = REPLACE(content_value, ?, ?) 
            WHERE content_value LIKE CONCAT("%", ?)
        ');
        $stmtContent->execute([$oldFilename, $webpFilename, $oldFilename]);

        // 7. Update site_content_translations table
        $stmtTrans = $pdo->prepare('
            UPDATE site_content_translations 
            SET content_value = REPLACE(content_value, ?, ?) 
            WHERE content_value LIKE CONCAT("%", ?)
        ');
        $stmtTrans->execute([$oldFilename, $webpFilename, $oldFilename]);

        $pdo->commit();

        // Safely remove original file after successful DB commit
        if (file_exists($sourcePath) && $sourcePath !== $webpPath) {
            @unlink($sourcePath);
        }

        $stats['success_count']++;
        $stats['total_size_before'] += $sizeBefore;
        $stats['total_size_after'] += $sizeAfter;

        $reductionPercent = round((1 - ($sizeAfter / $sizeBefore)) * 100, 1);
        $beforeKB = round($sizeBefore / 1024, 1);
        $afterKB = round($sizeAfter / 1024, 1);

        echo "✅ [OK] {$oldFilename} -> {$webpFilename} | {$beforeKB} KB -> {$afterKB} KB (-{$reductionPercent}%)\n";

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if (file_exists($webpPath) && $webpPath !== $sourcePath) {
            @unlink($webpPath);
        }
        $stats['fail_count']++;
        $stats['errors'][] = "[ERROR BD] Error al actualizar BD para {$oldFilename}: " . $e->getMessage();
        echo "❌ [ERROR BD] {$oldFilename}: " . $e->getMessage() . "\n";
    }
}

// Summary report
$totalMbBefore = round($stats['total_size_before'] / (1024 * 1024), 2);
$totalMbAfter = round($stats['total_size_after'] / (1024 * 1024), 2);
$savedMb = round(($stats['total_size_before'] - $stats['total_size_after']) / (1024 * 1024), 2);
$overallReduction = $stats['total_size_before'] > 0 
    ? round((1 - ($stats['total_size_after'] / $stats['total_size_before'])) * 100, 1)
    : 0;

echo "\n========================================================\n";
echo "RESUMEN DE MIGRACIÓN WEBP\n";
echo "========================================================\n";
echo "Candidatos procesados : {$stats['total_candidates']}\n";
echo "Convertidos con éxito : {$stats['success_count']}\n";
echo "Ignorados             : {$stats['skip_count']}\n";
echo "Fallidos              : {$stats['fail_count']}\n";
echo "Peso total ANTES      : {$totalMbBefore} MB ({$stats['total_size_before']} bytes)\n";
echo "Peso total DESPUÉS    : {$totalMbAfter} MB ({$stats['total_size_after']} bytes)\n";
echo "Ahorro total de disco : {$savedMb} MB (-{$overallReduction}% de reducción)\n";

if (!empty($stats['errors'])) {
    echo "\nDetalle de errores:\n";
    foreach ($stats['errors'] as $err) {
        echo " - {$err}\n";
    }
}
echo "========================================================\n";

