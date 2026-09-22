<?php
/**
 * iWE Dashboard API - Site Health Backup Service
 * 
 * Handles generation of full database SQL dumps (mysqldump / PDO fallback),
 * ZIP packaging with media uploads and local config, and backup listings.
 */

declare(strict_types=1);

class HealthBackupService {
    private PDO $pdo;
    private array $config;
    private string $backupsDir;

    public function __construct(PDO $pdo, array $config, string $backupsDir) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->backupsDir = $backupsDir;
    }

    /**
     * Creates a full ZIP backup containing database.sql, config.local.php, and uploads/
     * 
     * @return array Backup metadata: filename, size_bytes, size_human, created_at, download_url
     * @throws RuntimeException
     */
    public function createBackupArchive(): array {
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

            return [
                'filename'     => $zipFilename,
                'size_bytes'   => $sizeBytes,
                'size_human'   => $this->formatBytes($sizeBytes),
                'created_at'   => date('Y-m-d H:i:s'),
                'download_url' => "/api/health/backups/{$zipFilename}",
            ];

        } catch (Throwable $e) {
            if (file_exists($sqlDumpFile)) {
                @unlink($sqlDumpFile);
            }
            if (file_exists($zipPath)) {
                @unlink($zipPath);
            }
            throw $e;
        }
    }

    /**
     * Lists existing backup ZIP files sorted newest first.
     */
    public function listBackups(): array {
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

        return $backups;
    }

    /**
     * Returns sanitized absolute path for a valid backup filename, or null if invalid/missing.
     */
    public function getValidBackupPath(string $filename): ?string {
        $filename = basename(trim($filename));

        // Strict whitelist validation: only backup_*.zip with safe alphanumeric/hyphen/underscore chars
        if (!preg_match('/^backup_[a-zA-Z0-9_\-]+\.zip$/', $filename)) {
            return null;
        }

        $filePath = realpath($this->backupsDir . '/' . $filename);
        $expectedDir = realpath($this->backupsDir);

        if (!$filePath || !$expectedDir || !str_starts_with($filePath, $expectedDir) || !is_file($filePath)) {
            return null;
        }

        return $filePath;
    }

    public function generateDatabaseDump(string $outputSqlPath): void {
        $dbConfig = $this->config['db'] ?? [];
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

    public function findMysqldumpBinary(): ?string {
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

    public function generatePdoDump(string $outputSqlPath, string $dbName): void {
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

    public function formatBytes(int $bytes, int $precision = 2): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

