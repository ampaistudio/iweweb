<?php
/**
 * iWE Dashboard API - Site Health Telegram Notifier
 * 
 * Handles Telegram bot alert dispatching, throttle caching (24h cooldown for identical red issues),
 * and Markdown report formatting for site health status.
 */

declare(strict_types=1);

class HealthTelegramNotifier {
    private array $config;
    private string $cacheDir;

    public function __construct(array $config, string $cacheDir) {
        $this->config = $config;
        $this->cacheDir = $cacheDir;
    }

    public function getTelegramConfig(): array {
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

    public function lazyNotifyIfEligible(array $runtime, array $dependencies): bool {
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

    public function buildTelegramReportMessage(array $runtime, array $dependencies, bool $isManual): string {
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

    public function sendTelegramMessage(string $botToken, string $chatId, string $message): array {
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

