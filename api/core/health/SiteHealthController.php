<?php
/**
 * iWE Dashboard API - Site Health, Diagnostics & Backup Controller
 * 
 * Provides:
 * 1. Comprehensive runtime & dependency version diagnostics with npm registry & PHP checks.
 * 2. 1-Click Database + Config + Media Uploads ZIP backup generator.
 * 3. Secure backup download with strict path traversal sanitization.
 * 4. Telegram Bot health alert notifications (lazy auto-throttled + manual).
 * 
 * Protected by requireAdmin() across all endpoints.
 */

declare(strict_types=1);

class SiteHealthController {
    private PDO $pdo;
    private array $config;
    private string $backupsDir;
    private string $cacheDir;
    private string $rootDir;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->rootDir = realpath(__DIR__ . '/../../../') ?: dirname(__DIR__, 3);
        $this->backupsDir = __DIR__ . '/../../storage/backups';
        $this->cacheDir = __DIR__ . '/../../storage/cache';

        $this->ensureDirectories();
    }

    private function ensureDirectories(): void {
        if (!is_dir($this->backupsDir)) {
            @mkdir($this->backupsDir, 0755, true);
        }
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * GET /api/health/status
     * Returns full diagnostic report of runtime, database, packages, and overall health score.
     */
    public function getStatus(): void {
        requireAdmin($this->pdo);

        $refresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';

        // 1. Runtime inspection
        $runtime = $this->inspectRuntime();

        // 2. Dependencies inspection (Web public & Dashboard)
        $dependencies = $this->inspectDependencies($refresh);

        // 3. Overall severity calculation
        $severities = [];
        if (isset($runtime['php']['severity'])) $severities[] = $runtime['php']['severity'];
        if (isset($runtime['mysql']['severity'])) $severities[] = $runtime['mysql']['severity'];
        foreach ($dependencies['web'] as $dep) {
            $severities[] = $dep['severity'];
        }
        foreach ($dependencies['dashboard'] as $dep) {
            $severities[] = $dep['severity'];
        }

        $overallSeverity = 'green';
        if (in_array('red', $severities, true)) {
            $overallSeverity = 'red';
        } elseif (in_array('yellow', $severities, true)) {
            $overallSeverity = 'yellow';
        }

        // 4. Telegram Bot configuration status
        $telegramConfig = $this->getTelegramConfig();

        // 5. Check and trigger lazy alert if red components detected and not recently notified
        $alertTriggered = false;
        if ($overallSeverity === 'red' && !empty($telegramConfig['bot_token']) && !empty($telegramConfig['chat_id'])) {
            $alertTriggered = $this->lazyNotifyIfEligible($runtime, $dependencies);
        }

        jsonSuccess([
            'status'           => $overallSeverity,
            'summary'          => [
                'total_components'   => count($severities),
                'up_to_date_count'   => count(array_filter($severities, fn($s) => $s === 'green')),
                'minor_update_count' => count(array_filter($severities, fn($s) => $s === 'yellow')),
                'major_update_count' => count(array_filter($severities, fn($s) => $s === 'red')),
            ],
            'runtime'          => $runtime,
            'dependencies'     => $dependencies,
            'telegram'         => [
                'is_configured'   => !empty($telegramConfig['bot_token']) && !empty($telegramConfig['chat_id']),
                'has_bot_token'   => !empty($telegramConfig['bot_token']),
                'has_chat_id'     => !empty($telegramConfig['chat_id']),
                'masked_token'    => !empty($telegramConfig['bot_token']) ? ('••••' . substr($telegramConfig['bot_token'], -4)) : '',
                'chat_id'         => $telegramConfig['chat_id'] ?: '',
                'alert_triggered' => $alertTriggered,
            ],
            'checked_at'       => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * POST /api/health/backup
     * Creates a full database SQL dump + config.local.php + uploads in a single ZIP file.
     */
    public function createBackup(): void {
        requireAdmin($this->pdo);

        // Max execution time extension for large backups
        @set_time_limit(180);
        @ini_set('memory_limit', '256M');

        $timestamp = date('Y-m-d_His');
        $zipFilename = "backup_{$timestamp}.zip";
        $zipPath = $this->backupsDir . '/' . $zipFilename;

        // Temporary SQL dump file
        $sqlDumpFile = $this->backupsDir . "/dump_{$timestamp}.sql";

        try {
            // 1. Generate SQL dump
            $this->generateDatabaseDump($sqlDumpFile);

            // 2. Build ZIP archive
            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('No se pudo crear el archivo ZIP de respaldo.');
            }

            // Add SQL dump to root of ZIP
            $zip->addFile($sqlDumpFile, 'database.sql');

            // Add config.local.php if present
            $localConfigFile = __DIR__ . '/../../config/config.local.php';
            if (is_file($localConfigFile)) {
                $zip->addFile($localConfigFile, 'config.local.php');
            }

            // Add uploaded media files from api/uploads/
            $uploadDir = realpath(__DIR__ . '/../../uploads');
            if ($uploadDir && is_dir($uploadDir)) {
                $files = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($uploadDir, RecursiveDirectoryIterator::SKIP_DOTS),
                    RecursiveIteratorIterator::LEAVES_ONLY
                );

                foreach ($files as $file) {
                    if (!$file->isDir()) {
                        $filePath = $file->getRealPath();
                        $relativePath = 'uploads/' . substr($filePath, strlen($uploadDir) + 1);
                        $zip->addFile($filePath, $relativePath);
                    }
                }
            }

            // Add metadata readme
            $metaContent = "====================================================\n" .
                           "iWE Mountain Bike & Tourism - Site Backup\n" .
                           "Created at: " . date('Y-m-d H:i:s') . "\n" .
                           "Environment: " . ($this->config['app']['env'] ?? 'production') . "\n" .
                           "Database: " . ($this->config['db']['database'] ?? 'iwe_dashboard') . "\n" .
                           "PHP Version: " . PHP_VERSION . "\n" .
                           "====================================================\n\n" .
                           "Contents:\n" .
                           "- database.sql: Full MySQL database schema and data dump.\n" .
                           "- config.local.php: Local configuration and API credentials.\n" .
                           "- uploads/: Uploaded CMS media and images.\n";
            $zip->addFromString('BACKUP_INFO.txt', $metaContent);

            $zip->close();

            // Clean up temporary sql dump file
            @unlink($sqlDumpFile);

            $sizeBytes = filesize($zipPath);

            jsonSuccess([
                'filename'    => $zipFilename,
                'size_bytes'  => $sizeBytes,
                'size_human'  => $this->formatBytes($sizeBytes),
                'created_at'  => date('Y-m-d H:i:s'),
                'download_url'=> "/api/health/backups/{$zipFilename}",
            ], 'Respaldo generado exitosamente.');

        } catch (Throwable $e) {
            if (file_exists($sqlDumpFile)) @unlink($sqlDumpFile);
            if (file_exists($zipPath)) @unlink($zipPath);
            error_log('Error al generar backup: ' . $e->getMessage());
            jsonError('Error al generar el respaldo: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/health/backups
     * Lists existing backup ZIP files.
     */
    public function listBackups(): void {
        requireAdmin($this->pdo);

        $backups = [];
        $files = glob($this->backupsDir . '/backup_*.zip') ?: [];

        foreach ($files as $filePath) {
            $filename = basename($filePath);
            $size = filesize($filePath);
            $ctime = filemtime($filePath);

            $backups[] = [
                'filename'     => $filename,
                'size_bytes'   => $size,
                'size_human'   => $this->formatBytes($size),
                'created_at'   => date('Y-m-d H:i:s', $ctime),
                'download_url' => "/api/health/backups/{$filename}",
            ];
        }

        // Sort by creation time descending (newest first)
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        jsonSuccess([
            'backups' => $backups,
            'total'   => count($backups),
        ]);
    }

    /**
     * GET /api/health/backups/:filename
     * Downloads a backup ZIP with path traversal sanitization.
     */
    public function downloadBackup(string $filename): void {
        requireAdmin($this->pdo);

        $filename = basename(trim($filename));

        // Strict whitelist validation: only backup_*.zip with safe alphanumeric/hyphen/underscore chars
        if (!preg_match('/^backup_[a-zA-Z0-9_\-]+\.zip$/', $filename)) {
            jsonError('Nombre de archivo de respaldo no válido.', 400);
        }

        $filePath = realpath($this->backupsDir . '/' . $filename);
        $expectedDir = realpath($this->backupsDir);

        if (!$filePath || !$expectedDir || !str_starts_with($filePath, $expectedDir) || !is_file($filePath)) {
            jsonError('El archivo de respaldo solicitado no existe.', 404);
        }

        // Stream file download
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');

        // Flush output buffer
        if (ob_get_level()) {
            ob_end_clean();
        }

        readfile($filePath);
        exit;
    }

    /**
     * POST /api/health/notify
     * Sends manual Markdown notification to Telegram bot with current health status.
     */
    public function notifyTelegram(): void {
        requireAdmin($this->pdo);

        $telegramConfig = $this->getTelegramConfig();
        if (empty($telegramConfig['bot_token']) || empty($telegramConfig['chat_id'])) {
            jsonError('Telegram Bot no está configurado. Completa TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en la sección de credenciales.', 400);
        }

        $runtime = $this->inspectRuntime();
        $dependencies = $this->inspectDependencies(false);

        $message = $this->buildTelegramReportMessage($runtime, $dependencies, true);

        $result = $this->sendTelegramMessage(
            $telegramConfig['bot_token'],
            $telegramConfig['chat_id'],
            $message
        );

        if ($result['success']) {
            jsonSuccess([
                'success'    => true,
                'message_id' => $result['message_id'] ?? null,
            ], 'Notificación enviada exitosamente a Telegram.');
        } else {
            jsonError('Error al enviar mensaje por Telegram: ' . $result['error'], 400);
        }
    }

    // -------------------------------------------------------------------------
    // Diagnostic Inspection Helpers
    // -------------------------------------------------------------------------

    private function inspectRuntime(): array {
        // PHP inspection
        $phpVersion = PHP_VERSION;
        $phpMajorMinor = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
        
        // PHP lifecycle: 8.2 & 8.3 & 8.4 are active/security supported. 8.1 and below are EOL.
        $phpLatest = '8.3.15';
        $phpRemote = $this->fetchLatestPhpVersion();
        if ($phpRemote) {
            $phpLatest = $phpRemote;
        }

        $phpSeverity = 'green';
        $phpStatusText = 'Al día y con soporte oficial';

        if (version_compare($phpMajorMinor, '8.2', '<')) {
            $phpSeverity = 'red';
            $phpStatusText = 'Versión sin soporte de seguridad (End of Life)';
        } elseif (version_compare(PHP_VERSION, $phpLatest, '<')) {
            // Check if major/minor diff vs patch
            $installedParts = explode('.', PHP_VERSION);
            $latestParts = explode('.', $phpLatest);
            if (($latestParts[0] ?? 0) > ($installedParts[0] ?? 0) || ($latestParts[1] ?? 0) > ($installedParts[1] ?? 0)) {
                $phpSeverity = 'yellow';
                $phpStatusText = 'Actualización de versión disponible';
            } else {
                $phpSeverity = 'green';
                $phpStatusText = 'Al día (parche disponible)';
            }
        }

        // MySQL inspection
        $mysqlVersion = 'Desconocida';
        $mysqlSeverity = 'green';
        $mysqlStatusText = 'Conexión activa';
        try {
            $rawVer = (string)$this->pdo->query('SELECT VERSION()')->fetchColumn();
            $mysqlVersion = $rawVer;
            if (stripos($rawVer, 'mariadb') !== false) {
                // MariaDB check
                preg_match('/(\d+\.\d+\.\d+)/', $rawVer, $m);
                $cleanVer = $m[1] ?? $rawVer;
                if (version_compare($cleanVer, '10.4', '<')) {
                    $mysqlSeverity = 'red';
                    $mysqlStatusText = 'Versión de MariaDB obsoleta';
                }
            } else {
                // Standard MySQL
                preg_match('/(\d+\.\d+\.\d+)/', $rawVer, $m);
                $cleanVer = $m[1] ?? $rawVer;
                if (version_compare($cleanVer, '8.0', '<')) {
                    $mysqlSeverity = 'red';
                    $mysqlStatusText = 'MySQL 5.7 o inferior sin soporte oficial';
                }
            }
        } catch (Throwable $e) {
            $mysqlSeverity = 'red';
            $mysqlStatusText = 'Error de conexión: ' . $e->getMessage();
        }

        return [
            'php' => [
                'name'              => 'PHP Runtime',
                'installed_version' => $phpVersion,
                'latest_version'    => $phpLatest,
                'severity'          => $phpSeverity,
                'status_text'       => $phpStatusText,
                'sapi'              => php_sapi_name(),
                'memory_limit'      => ini_get('memory_limit'),
                'max_execution_time'=> ini_get('max_execution_time') . 's',
                'extensions'        => [
                    'pdo_mysql' => extension_loaded('pdo_mysql'),
                    'curl'      => extension_loaded('curl'),
                    'zip'       => extension_loaded('zip'),
                    'gd'        => extension_loaded('gd'),
                    'mbstring'  => extension_loaded('mbstring'),
                ],
            ],
            'mysql' => [
                'name'              => 'Base de Datos (MySQL / MariaDB)',
                'installed_version' => $mysqlVersion,
                'severity'          => $mysqlSeverity,
                'status_text'       => $mysqlStatusText,
                'database_name'     => $this->config['db']['database'] ?? 'iwe_dashboard',
            ],
            'server' => [
                'name'              => 'Servidor Web',
                'software'          => $_SERVER['SERVER_SOFTWARE'] ?? php_sapi_name(),
                'os'                => PHP_OS,
                'time'              => date('Y-m-d H:i:s T'),
            ],
        ];
    }

    private function inspectDependencies(bool $forceRefresh = false): array {
        $webPackages = [
            'react'             => 'Framework UI Principal',
            'react-dom'         => 'Renderizador React DOM',
            'vite'              => 'Bundler & Dev Server',
            'typescript'        => 'Compilador TypeScript',
            '@tailwindcss/vite' => 'Plugin Tailwind CSS v4 para Vite',
            'tailwindcss'       => 'Motor Tailwind CSS',
            'lucide-react'      => 'Librería de Iconos',
            'clsx'              => 'Utilidad de Clases CSS',
            'tailwind-merge'    => 'Merge Inteligente de Clases Tailwind',
        ];

        $dashboardPackages = [
            'react'             => 'Framework UI Dashboard',
            'react-dom'         => 'Renderizador React DOM',
            'react-router-dom'  => 'Enrutamiento SPA del Dashboard',
            'vite'              => 'Bundler & Dev Server',
            'typescript'        => 'Compilador TypeScript',
            '@tailwindcss/vite' => 'Plugin Tailwind CSS v4 para Vite',
            'lucide-react'      => 'Librería de Iconos',
        ];

        $webResults = [];
        $webPkgJson = $this->readJsonFile($this->rootDir . '/package.json');
        $webLockJson = $this->readJsonFile($this->rootDir . '/package-lock.json');

        foreach ($webPackages as $pkgName => $desc) {
            $webResults[] = $this->inspectSinglePackage(
                $pkgName,
                $desc,
                $this->rootDir,
                $webPkgJson,
                $webLockJson,
                $forceRefresh
            );
        }

        $dashResults = [];
        $dashDir = $this->rootDir . '/dashboard';
        $dashPkgJson = $this->readJsonFile($dashDir . '/package.json');
        $dashLockJson = $this->readJsonFile($dashDir . '/package-lock.json');

        foreach ($dashboardPackages as $pkgName => $desc) {
            $dashResults[] = $this->inspectSinglePackage(
                $pkgName,
                $desc,
                $dashDir,
                $dashPkgJson,
                $dashLockJson,
                $forceRefresh
            );
        }

        return [
            'web'       => $webResults,
            'dashboard' => $dashResults,
        ];
    }

    private function inspectSinglePackage(
        string $pkgName,
        string $description,
        string $projectDir,
        ?array $pkgJson,
        ?array $lockJson,
        bool $forceRefresh
    ): array {
        // 1. Declared version in package.json
        $declared = $pkgJson['dependencies'][$pkgName] ?? $pkgJson['devDependencies'][$pkgName] ?? null;

        // 2. Real installed version
        $installed = null;

        // Try node_modules direct package.json
        $nodeModulesPkg = $projectDir . '/node_modules/' . $pkgName . '/package.json';
        if (is_file($nodeModulesPkg)) {
            $directPkg = $this->readJsonFile($nodeModulesPkg);
            if (!empty($directPkg['version'])) {
                $installed = (string)$directPkg['version'];
            }
        }

        // Fallback to lockfile
        if (!$installed && $lockJson) {
            $installed = $lockJson['packages']['node_modules/' . $pkgName]['version']
                ?? $lockJson['dependencies'][$pkgName]['version']
                ?? null;
        }

        if (!$installed && $declared) {
            $installed = ltrim($declared, '^~>=<');
        }

        if (!$installed) {
            $installed = 'No instalado';
        }

        // 3. Query NPM Registry for latest version
        $latest = $this->fetchNpmLatestVersion($pkgName, $forceRefresh);

        // 4. Calculate severity
        $severity = 'green';
        $statusText = 'Al día';

        if ($installed === 'No instalado') {
            $severity = 'red';
            $statusText = 'Paquete no encontrado en node_modules';
        } elseif ($latest === null) {
            $severity = 'yellow';
            $statusText = 'No se pudo consultar el registry de NPM';
        } else {
            $cleanInstalled = preg_replace('/[^\d\.]/', '', explode('-', $installed)[0]);
            $cleanLatest = preg_replace('/[^\d\.]/', '', explode('-', $latest)[0]);

            $instParts = array_map('intval', explode('.', $cleanInstalled));
            $latParts = array_map('intval', explode('.', $cleanLatest));

            $instMajor = $instParts[0] ?? 0;
            $instMinor = $instParts[1] ?? 0;
            $latMajor = $latParts[0] ?? 0;
            $latMinor = $latParts[1] ?? 0;

            if ($latMajor > $instMajor) {
                $severity = 'red';
                $statusText = "Actualización mayor disponible ({$latest})";
            } elseif ($latMinor > $instMinor) {
                $severity = 'yellow';
                $statusText = "Actualización menor disponible ({$latest})";
            } else {
                $severity = 'green';
                $statusText = 'Al día';
            }
        }

        return [
            'package_name'      => $pkgName,
            'description'       => $description,
            'declared_version'  => $declared ?: 'No declarada',
            'installed_version' => $installed,
            'latest_version'    => $latest ?: 'Desconocida',
            'severity'          => $severity,
            'status_text'       => $statusText,
        ];
    }

    private function fetchNpmLatestVersion(string $pkgName, bool $forceRefresh = false): ?string {
        $safeName = preg_replace('/[^a-zA-Z0-9_\-@]/', '_', $pkgName);
        $cacheFile = $this->cacheDir . "/npm_{$safeName}.json";

        // Check 24-hour cache
        if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
            $cached = $this->readJsonFile($cacheFile);
            if (!empty($cached['version'])) {
                return (string)$cached['version'];
            }
        }

        // Fetch from npm registry
        $url = 'https://registry.npmjs.org/' . urlencode($pkgName) . '/latest';
        if (str_starts_with($pkgName, '@')) {
            // Scoped packages: encode scope and package: @tailwindcss/vite -> @tailwindcss%2Fvite
            $url = 'https://registry.npmjs.org/' . str_replace('/', '%2F', $pkgName) . '/latest';
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: iWE-Health-Checker/1.0'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (!empty($data['version'])) {
                $version = (string)$data['version'];
                file_put_contents($cacheFile, json_encode([
                    'version'    => $version,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]));
                return $version;
            }
        }

        // Return stale cache if available
        if (file_exists($cacheFile)) {
            $cached = $this->readJsonFile($cacheFile);
            if (!empty($cached['version'])) {
                return (string)$cached['version'];
            }
        }

        return null;
    }

    private function fetchLatestPhpVersion(): ?string {
        $cacheFile = $this->cacheDir . '/php_latest.json';

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
            $cached = $this->readJsonFile($cacheFile);
            if (!empty($cached['version'])) {
                return (string)$cached['version'];
            }
        }

        $ch = curl_init('https://www.php.net/releases/index.php?json&version=8&max=1');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: iWE-Health-Checker/1.0'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (is_array($data) && !empty($data)) {
                $versions = array_keys($data);
                $latest = $versions[0] ?? null;
                if ($latest) {
                    file_put_contents($cacheFile, json_encode([
                        'version'    => $latest,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]));
                    return (string)$latest;
                }
            }
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Database Dump Generation
    // -------------------------------------------------------------------------

    private function generateDatabaseDump(string $outputSqlPath): void {
        $dbConfig = $this->config['db'];
        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = $dbConfig['port'] ?? 3306;
        $dbName = $dbConfig['database'] ?? 'iwe_dashboard';
        $user = $dbConfig['username'] ?? 'root';
        $pass = $dbConfig['password'] ?? '';

        // Try mysqldump command first if available
        $mysqldumpPath = $this->findMysqldumpBinary();
        if ($mysqldumpPath && function_exists('exec')) {
            $cmd = sprintf(
                '%s --host=%s --port=%s --user=%s %s %s > %s 2>&1',
                escapeshellcmd($mysqldumpPath),
                escapeshellarg((string)$host),
                escapeshellarg((string)$port),
                escapeshellarg((string)$user),
                !empty($pass) ? ('--password=' . escapeshellarg((string)$pass)) : '',
                escapeshellarg((string)$dbName),
                escapeshellarg($outputSqlPath)
            );

            @exec($cmd, $output, $returnVar);
            if ($returnVar === 0 && file_exists($outputSqlPath) && filesize($outputSqlPath) > 50) {
                return; // mysqldump success
            }
        }

        // Fallback: Pure PDO SQL Dump Generator
        $this->generatePdoDump($outputSqlPath, $dbName);
    }

    private function findMysqldumpBinary(): ?string {
        $candidates = [
            'mysqldump',
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump',
            '/opt/homebrew/bin/mysqldump',
            '/Applications/MAMP/Library/bin/mysqldump',
            '/xampp/mysql/bin/mysqldump',
        ];

        foreach ($candidates as $bin) {
            if ($bin === 'mysqldump') {
                $out = @shell_exec('which mysqldump 2>/dev/null');
                if ($out && trim($out) !== '') {
                    return trim($out);
                }
            } elseif (is_executable($bin)) {
                return $bin;
            }
        }

        return null;
    }

    private function generatePdoDump(string $outputSqlPath, string $dbName): void {
        $handle = fopen($outputSqlPath, 'w');
        if (!$handle) {
            throw new RuntimeException("No se pudo escribir el archivo SQL temporal: {$outputSqlPath}");
        }

        fwrite($handle, "-- ====================================================\n");
        fwrite($handle, "-- iWE Database SQL Dump (PDO Fallback)\n");
        fwrite($handle, "-- Database: `{$dbName}`\n");
        fwrite($handle, "-- Date: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- ====================================================\n\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n");
        fwrite($handle, "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n");
        fwrite($handle, "START TRANSACTION;\n");
        fwrite($handle, "SET time_zone = \"+00:00\";\n\n");

        $tablesStmt = $this->pdo->query('SHOW TABLES');
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as $table) {
            // Drop & Create Table
            fwrite($handle, "-- -----------------------------------------------------\n");
            fwrite($handle, "-- Structure for table `{$table}`\n");
            fwrite($handle, "-- -----------------------------------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");

            $createStmt = $this->pdo->query("SHOW CREATE TABLE `{$table}`");
            $createRow = $createStmt->fetch(PDO::FETCH_NUM);
            if (!empty($createRow[1])) {
                fwrite($handle, $createRow[1] . ";\n\n");
            }

            // Dump Rows
            $rowsStmt = $this->pdo->query("SELECT * FROM `{$table}`");
            $rows = $rowsStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                fwrite($handle, "-- Dumping data for table `{$table}`\n");
                $columns = array_keys($rows[0]);
                $colNames = implode('`, `', $columns);

                foreach (array_chunk($rows, 50) as $chunk) {
                    $valSets = [];
                    foreach ($chunk as $row) {
                        $escapedVals = [];
                        foreach ($row as $val) {
                            if ($val === null) {
                                $escapedVals[] = 'NULL';
                            } else {
                                $escapedVals[] = $this->pdo->quote((string)$val);
                            }
                        }
                        $valSets[] = '(' . implode(', ', $escapedVals) . ')';
                    }
                    fwrite($handle, "INSERT INTO `{$table}` (`{$colNames}`) VALUES\n" . implode(",\n", $valSets) . ";\n");
                }
                fwrite($handle, "\n");
            }
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        fwrite($handle, "COMMIT;\n");
        fclose($handle);
    }

    // -------------------------------------------------------------------------
    // Telegram Alert Helpers
    // -------------------------------------------------------------------------

    private function getTelegramConfig(): array {
        $localData = [];
        $localFile = __DIR__ . '/../../config/config.local.php';
        if (file_exists($localFile)) {
            $localData = require $localFile;
        }

        $botToken = $localData['telegram']['bot_token'] ?? $this->config['telegram']['bot_token'] ?? getenv('TELEGRAM_BOT_TOKEN') ?: '';
        $chatId = $localData['telegram']['chat_id'] ?? $this->config['telegram']['chat_id'] ?? getenv('TELEGRAM_CHAT_ID') ?: '';

        return [
            'bot_token' => (string)$botToken,
            'chat_id'   => (string)$chatId,
        ];
    }

    private function lazyNotifyIfEligible(array $runtime, array $dependencies): bool {
        $cacheFile = $this->cacheDir . '/last_telegram_alert.json';
        $now = time();

        // Find red components
        $redItems = [];
        if (($runtime['php']['severity'] ?? '') === 'red') {
            $redItems[] = 'PHP Runtime: ' . $runtime['php']['installed_version'];
        }
        if (($runtime['mysql']['severity'] ?? '') === 'red') {
            $redItems[] = 'MySQL/MariaDB: ' . $runtime['mysql']['installed_version'];
        }
        foreach ($dependencies['web'] as $dep) {
            if ($dep['severity'] === 'red') {
                $redItems[] = "Web: {$dep['package_name']} ({$dep['installed_version']} -> {$dep['latest_version']})";
            }
        }
        foreach ($dependencies['dashboard'] as $dep) {
            if ($dep['severity'] === 'red') {
                $redItems[] = "Dashboard: {$dep['package_name']} ({$dep['installed_version']} -> {$dep['latest_version']})";
            }
        }

        if (empty($redItems)) {
            return false;
        }

        $redSignature = md5(implode('|', $redItems));

        if (file_exists($cacheFile)) {
            $cached = $this->readJsonFile($cacheFile);
            $lastSent = (int)($cached['timestamp'] ?? 0);
            $lastSignature = (string)($cached['signature'] ?? '');

            // Throttle: avoid spam if sent less than 24 hours ago with identical red signature
            if (($now - $lastSent < 86400) && ($lastSignature === $redSignature)) {
                return false;
            }
        }

        $telegramConfig = $this->getTelegramConfig();
        $message = $this->buildTelegramReportMessage($runtime, $dependencies, false);

        $res = $this->sendTelegramMessage(
            $telegramConfig['bot_token'],
            $telegramConfig['chat_id'],
            $message
        );

        if ($res['success']) {
            file_put_contents($cacheFile, json_encode([
                'timestamp' => $now,
                'signature' => $redSignature,
                'items'     => $redItems,
                'sent_at'   => date('Y-m-d H:i:s'),
            ]));
            return true;
        }

        return false;
    }

    private function buildTelegramReportMessage(array $runtime, array $dependencies, bool $isManual): string {
        $env = strtoupper($this->config['app']['env'] ?? 'LOCAL');
        $date = date('Y-m-d H:i:s');
        $prefix = $isManual ? "🩺 *iWE — Reporte de Salud del Sitio (Manual)*" : "⚠️ *iWE — Alerta de Actualización Crítica*";

        $lines = [
            $prefix,
            "📅 *Fecha:* `{$date}`",
            "🌐 *Entorno:* `{$env}`",
            "",
            "⚙️ *Runtime:*",
            "• PHP: `{$runtime['php']['installed_version']}` (" . $runtime['php']['status_text'] . ")",
            "• DB: `{$runtime['mysql']['installed_version']}`",
            "",
            "📦 *Dependencias Web:*",
        ];

        foreach ($dependencies['web'] as $d) {
            $icon = $d['severity'] === 'red' ? '🔴' : ($d['severity'] === 'yellow' ? '🟡' : '🟢');
            $lines[] = "{$icon} `{$d['package_name']}`: `{$d['installed_version']}` (disp: `{$d['latest_version']}`)";
        }

        $lines[] = "";
        $lines[] = "📊 *Dependencias Dashboard:*";
        foreach ($dependencies['dashboard'] as $d) {
            $icon = $d['severity'] === 'red' ? '🔴' : ($d['severity'] === 'yellow' ? '🟡' : '🟢');
            $lines[] = "{$icon} `{$d['package_name']}`: `{$d['installed_version']}` (disp: `{$d['latest_version']}`)";
        }

        $lines[] = "";
        $lines[] = "👉 _Ingresa al dashboard para gestionar respaldos e información:_";
        $lines[] = "[Abrir Dashboard de iWE](https://i-wildland.com/dashboard/settings/site-health)";

        return implode("\n", $lines);
    }

    private function sendTelegramMessage(string $botToken, string $chatId, string $message): array {
        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        $payload = json_encode([
            'chat_id'                  => $chatId,
            'text'                     => $message,
            'parse_mode'               => 'Markdown',
            'disable_web_page_preview' => true,
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['success' => false, 'error' => "Error cURL: {$curlError}"];
        }

        $data = json_decode($response, true);
        if ($httpCode === 200 && !empty($data['ok'])) {
            return [
                'success'    => true,
                'message_id' => $data['result']['message_id'] ?? null,
            ];
        }

        $desc = $data['description'] ?? "HTTP {$httpCode}";
        return ['success' => false, 'error' => $desc];
    }

    // -------------------------------------------------------------------------
    // Utility Helpers
    // -------------------------------------------------------------------------

    private function readJsonFile(string $filePath): ?array {
        if (!is_file($filePath)) {
            return null;
        }
        $content = file_get_contents($filePath);
        if ($content === false) {
            return null;
        }
        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    private function formatBytes(int $bytes, int $precision = 2): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

