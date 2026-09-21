<?php
/**
 * iWE Dashboard API - Site Health Runtime Checker
 * 
 * Inspects PHP environment, extensions, MySQL/MariaDB version, and server software.
 */

declare(strict_types=1);

class HealthRuntimeChecker {
    private PDO $pdo;
    private array $config;
    private string $cacheDir;

    public function __construct(PDO $pdo, array $config, string $cacheDir) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->cacheDir = $cacheDir;
    }

    public function inspectRuntime(): array {
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

    public function fetchLatestPhpVersion(): ?string {
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
}

