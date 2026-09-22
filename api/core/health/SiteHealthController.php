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

require_once __DIR__ . '/HealthRuntimeChecker.php';
require_once __DIR__ . '/HealthDependencyChecker.php';
require_once __DIR__ . '/HealthBackupService.php';
require_once __DIR__ . '/HealthTelegramNotifier.php';

class SiteHealthController {
    private PDO $pdo;
    private array $config;
    private string $backupsDir;
    private string $cacheDir;
    private string $rootDir;

    private HealthRuntimeChecker $runtimeChecker;
    private HealthDependencyChecker $dependencyChecker;
    private HealthBackupService $backupService;
    private HealthTelegramNotifier $telegramNotifier;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->rootDir = realpath(__DIR__ . '/../../../') ?: dirname(__DIR__, 3);
        $this->backupsDir = __DIR__ . '/../../storage/backups';
        $this->cacheDir = __DIR__ . '/../../storage/cache';

        $this->ensureDirectories();

        $panelDir = $this->config['app']['panel_dir'] ?? 'admin-panel';
        $this->runtimeChecker = new HealthRuntimeChecker($this->pdo, $this->config, $this->cacheDir);
        $this->dependencyChecker = new HealthDependencyChecker($this->rootDir, $this->cacheDir, $panelDir);
        $this->backupService = new HealthBackupService($this->pdo, $this->config, $this->backupsDir);
        $this->telegramNotifier = new HealthTelegramNotifier($this->config, $this->cacheDir);
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
        $runtime = $this->runtimeChecker->inspectRuntime();

        // 2. Dependencies inspection (Web public & Dashboard)
        $dependencies = $this->dependencyChecker->inspectDependencies($refresh);

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
        $telegramConfig = $this->telegramNotifier->getTelegramConfig();

        // 5. Check and trigger lazy alert if red components detected and not recently notified
        $alertTriggered = false;
        if ($overallSeverity === 'red' && !empty($telegramConfig['bot_token']) && !empty($telegramConfig['chat_id'])) {
            $alertTriggered = $this->telegramNotifier->lazyNotifyIfEligible($runtime, $dependencies);
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

        try {
            $result = $this->backupService->createBackupArchive();
            jsonSuccess($result, 'Respaldo generado exitosamente.');
        } catch (Throwable $e) {
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

        $backups = $this->backupService->listBackups();

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

        $cleanFilename = basename(trim($filename));
        if (!preg_match('/^backup_[a-zA-Z0-9_\-]+\.zip$/', $cleanFilename)) {
            jsonError('Nombre de archivo de respaldo no válido.', 400);
        }

        $filePath = $this->backupService->getValidBackupPath($cleanFilename);
        if (!$filePath) {
            jsonError('El archivo de respaldo solicitado no existe.', 404);
        }

        // Stream file download
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $cleanFilename . '"');
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

        $telegramConfig = $this->telegramNotifier->getTelegramConfig();
        if (empty($telegramConfig['bot_token']) || empty($telegramConfig['chat_id'])) {
            jsonError('Telegram Bot no está configurado. Completa TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en la sección de credenciales.', 400);
        }

        $runtime = $this->runtimeChecker->inspectRuntime();
        $dependencies = $this->dependencyChecker->inspectDependencies(false);

        $message = $this->telegramNotifier->buildTelegramReportMessage($runtime, $dependencies, true);

        $result = $this->telegramNotifier->sendTelegramMessage(
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
    // Backward-Compatibility & Internal Delegation Helpers
    // -------------------------------------------------------------------------

    private function inspectRuntime(): array {
        return $this->runtimeChecker->inspectRuntime();
    }

    private function inspectDependencies(bool $forceRefresh = false): array {
        return $this->dependencyChecker->inspectDependencies($forceRefresh);
    }

    private function getTelegramConfig(): array {
        return $this->telegramNotifier->getTelegramConfig();
    }

    private function lazyNotifyIfEligible(array $runtime, array $dependencies): bool {
        return $this->telegramNotifier->lazyNotifyIfEligible($runtime, $dependencies);
    }

    private function buildTelegramReportMessage(array $runtime, array $dependencies, bool $isManual): string {
        return $this->telegramNotifier->buildTelegramReportMessage($runtime, $dependencies, $isManual);
    }

    private function sendTelegramMessage(string $botToken, string $chatId, string $message): array {
        return $this->telegramNotifier->sendTelegramMessage($botToken, $chatId, $message);
    }

    private function findMysqldumpBinary(): ?string {
        return $this->backupService->findMysqldumpBinary();
    }

    private function formatBytes(int $bytes, int $precision = 2): string {
        return $this->backupService->formatBytes($bytes, $precision);
    }
}
