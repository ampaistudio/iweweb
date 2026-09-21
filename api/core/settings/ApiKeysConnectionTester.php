<?php
/**
 * iWE Dashboard API - Third-Party Service Connection Tester
 * 
 * Executes live minimal ping/handshake requests against external providers:
 * NVIDIA NIM, OpenAI, Google Gemini, Anthropic Claude, Meta Graph API,
 * Google Places, TripAdvisor Content API, and Telegram Bot API.
 */

declare(strict_types=1);

require_once __DIR__ . '/ApiKeysMasker.php';

class ApiKeysConnectionTester {
    private array $config;

    public function __construct(array $config = []) {
        $this->config = $config;
    }

    /**
     * Dispatches a live connection check for the requested service.
     */
    public function test(string $service, array $localData): void {
        switch ($service) {
            case 'nvidia_nim':
                $this->testNvidiaNim($localData);
                break;
            case 'openai':
                $this->testOpenAi($localData);
                break;
            case 'gemini':
                $this->testGemini($localData);
                break;
            case 'anthropic':
                $this->testAnthropic($localData);
                break;
            case 'meta':
                $this->testMeta($localData);
                break;
            case 'google_places':
                $this->testGooglePlaces($localData);
                break;
            case 'tripadvisor':
                $this->testTripAdvisor($localData);
                break;
            case 'telegram':
                $this->testTelegram($localData);
                break;
            default:
                jsonError("Servicio de prueba '{$service}' no reconocido.", 422);
        }
    }

    private function testNvidiaNim(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('NVIDIA_NIM_API_KEY', $localData, $this->config);
        $apiUrl = ApiKeysMasker::resolveValue('NVIDIA_NIM_API_URL', $localData, $this->config) ?: 'https://integrate.api.nvidia.com/v1/chat/completions';
        $model = ApiKeysMasker::resolveValue('NVIDIA_NIM_MODEL', $localData, $this->config) ?: 'meta/llama-3.1-70b-instruct';

        if (empty($apiKey)) {
            jsonError('NVIDIA_NIM_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        $payload = json_encode([
            'model'      => $model,
            'messages'   => [
                ['role' => 'user', 'content' => 'Ping']
            ],
            'max_tokens' => 5,
        ]);

        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con NVIDIA NIM: {$curlError}", 502);
        }

        if ($httpCode === 200) {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => 'Conexión exitosa con NVIDIA NIM. La API key es válida y está lista para traducciones.',
            ]);
        } else {
            $parsed = json_decode((string)$response, true);
            $msg = $parsed['error']['message'] ?? $parsed['detail'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con NVIDIA NIM ({$httpCode}): {$msg}", 400);
        }
    }

    private function testOpenAi(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('OPENAI_API_KEY', $localData, $this->config);
        $model = ApiKeysMasker::resolveValue('OPENAI_MODEL', $localData, $this->config) ?: 'gpt-4o-mini';

        if (empty($apiKey)) {
            jsonError('OPENAI_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        $payload = json_encode([
            'model'      => $model,
            'messages'   => [
                ['role' => 'user', 'content' => 'Ping']
            ],
            'max_tokens' => 5,
        ]);

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con OpenAI: {$curlError}", 502);
        }

        if ($httpCode === 200) {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => "Conexión exitosa con OpenAI ({$model}). La API key es válida.",
            ]);
        } else {
            $parsed = json_decode((string)$response, true);
            $msg = $parsed['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con OpenAI ({$httpCode}): {$msg}", 400);
        }
    }

    private function testGemini(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('GEMINI_API_KEY', $localData, $this->config);
        $model = ApiKeysMasker::resolveValue('GEMINI_MODEL', $localData, $this->config) ?: 'gemini-1.5-flash';

        if (empty($apiKey)) {
            jsonError('GEMINI_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);
        $payload = json_encode([
            'contents' => [
                ['parts' => [['text' => 'Ping']]]
            ],
            'generationConfig' => [
                'maxOutputTokens' => 5
            ]
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con Google Gemini: {$curlError}", 502);
        }

        if ($httpCode === 200) {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => "Conexión exitosa con Google Gemini ({$model}). La API key es válida.",
            ]);
        } else {
            $parsed = json_decode((string)$response, true);
            $msg = $parsed['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con Google Gemini ({$httpCode}): {$msg}", 400);
        }
    }

    private function testAnthropic(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('ANTHROPIC_API_KEY', $localData, $this->config);
        $model = ApiKeysMasker::resolveValue('ANTHROPIC_MODEL', $localData, $this->config) ?: 'claude-3-5-haiku-20241022';

        if (empty($apiKey)) {
            jsonError('ANTHROPIC_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        $payload = json_encode([
            'model'      => $model,
            'max_tokens' => 5,
            'messages'   => [
                ['role' => 'user', 'content' => 'Ping']
            ],
        ]);

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . $apiKey,
                'anthropic-version: 2023-06-01',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con Anthropic: {$curlError}", 502);
        }

        if ($httpCode === 200) {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => "Conexión exitosa con Anthropic Claude ({$model}). La API key es válida.",
            ]);
        } else {
            $parsed = json_decode((string)$response, true);
            $msg = $parsed['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con Anthropic Claude ({$httpCode}): {$msg}", 400);
        }
    }

    private function testMeta(array $localData): void {
        $token = ApiKeysMasker::resolveValue('META_PAGE_ACCESS_TOKEN', $localData, $this->config);
        $pageId = ApiKeysMasker::resolveValue('META_PAGE_ID', $localData, $this->config);

        if (empty($token)) {
            jsonError('META_PAGE_ACCESS_TOKEN no está configurado.', 400);
        }

        $startTime = microtime(true);
        $url = 'https://graph.facebook.com/v21.0/me?access_token=' . urlencode($token);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con Meta Graph API: {$curlError}", 502);
        }

        $data = json_decode((string)$response, true);
        if ($httpCode === 200 && !empty($data['id'])) {
            $name = $data['name'] ?? 'Página Meta';
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => "Conexión exitosa con Meta Graph API. Autenticado como '{$name}' (ID: {$data['id']}).",
            ]);
        } else {
            $msg = $data['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de verificación con Meta ({$httpCode}): {$msg}", 400);
        }
    }

    private function testGooglePlaces(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('GOOGLE_PLACES_API_KEY', $localData, $this->config);

        if (empty($apiKey)) {
            jsonError('GOOGLE_PLACES_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        // Minimal query to Google Places FindPlace
        $url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Andorra&inputtype=textquery&fields=place_id&key=' . urlencode($apiKey);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con Google Places: {$curlError}", 502);
        }

        $data = json_decode((string)$response, true);
        if ($httpCode === 200 && ($data['status'] ?? '') === 'OK') {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => 'Conexión exitosa con Google Places API. La clave es válida.',
            ]);
        } else {
            $msg = $data['error_message'] ?? ($data['status'] ?? "HTTP {$httpCode}");
            jsonError("Error de Google Places API: {$msg}", 400);
        }
    }

    private function testTripAdvisor(array $localData): void {
        $apiKey = ApiKeysMasker::resolveValue('TRIPADVISOR_API_KEY', $localData, $this->config);
        $locationId = ApiKeysMasker::resolveValue('TRIPADVISOR_LOCATION_ID', $localData, $this->config) ?: 'd18719120';

        if (empty($apiKey)) {
            jsonError('TRIPADVISOR_API_KEY no está configurada.', 400);
        }

        $startTime = microtime(true);
        $url = "https://api.content.tripadvisor.com/api/v1/location/{$locationId}/details?key=" . urlencode($apiKey) . "&language=es";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => ['accept: application/json'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con TripAdvisor: {$curlError}", 502);
        }

        if ($httpCode === 200) {
            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => 'Conexión exitosa con TripAdvisor Content API. La clave es válida.',
            ]);
        } else {
            $data = json_decode((string)$response, true);
            $msg = $data['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de TripAdvisor API ({$httpCode}): {$msg}", 400);
        }
    }

    private function testTelegram(array $localData): void {
        $botToken = ApiKeysMasker::resolveValue('TELEGRAM_BOT_TOKEN', $localData, $this->config);
        $chatId = ApiKeysMasker::resolveValue('TELEGRAM_CHAT_ID', $localData, $this->config);

        if (empty($botToken)) {
            jsonError('TELEGRAM_BOT_TOKEN no está configurado.', 400);
        }

        $startTime = microtime(true);
        // Step 1: Verify Bot Token via getMe
        $getMeUrl = "https://api.telegram.org/bot{$botToken}/getMe";
        $ch = curl_init($getMeUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $latencyMs = round((microtime(true) - $startTime) * 1000);

        if ($curlError) {
            jsonError("Fallo de red al conectar con Telegram Bot API: {$curlError}", 502);
        }

        $data = json_decode((string)$response, true);
        if ($httpCode !== 200 || empty($data['ok'])) {
            $desc = $data['description'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con Telegram Bot API: {$desc}", 400);
        }

        $botUsername = $data['result']['username'] ?? 'Bot';
        $botName = $data['result']['first_name'] ?? 'Bot';

        // Step 2: If chat_id is provided, send a live test message
        if (!empty($chatId)) {
            $msgUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
            $msgPayload = json_encode([
                'chat_id'                  => $chatId,
                'text'                     => "✅ *iWE Dashboard*: Conexión con bot de Telegram (@{$botUsername}) verificada exitosamente.\n\n_Fecha:_ " . date('Y-m-d H:i:s') . "\n_Entorno:_ " . ($this->config['app']['env'] ?? 'local'),
                'parse_mode'               => 'Markdown',
                'disable_web_page_preview' => true,
            ]);

            $chMsg = curl_init($msgUrl);
            curl_setopt_array($chMsg, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $msgPayload,
                CURLOPT_TIMEOUT        => 8,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            ]);

            $msgResp = curl_exec($chMsg);
            $msgHttpCode = curl_getinfo($chMsg, CURLINFO_HTTP_CODE);
            $msgCurlError = curl_error($chMsg);
            curl_close($chMsg);

            $msgData = json_decode((string)$msgResp, true);
            if ($msgHttpCode !== 200 || empty($msgData['ok'])) {
                $msgDesc = $msgData['description'] ?? "HTTP {$msgHttpCode}";
                jsonError("Bot autenticado (@{$botUsername}), pero falló el envío al Chat ID {$chatId}: {$msgDesc}. Asegurate de haber iniciado conversación con el bot enviándole /start.", 400);
            }

            jsonSuccess([
                'success'    => true,
                'latency_ms' => $latencyMs,
                'message'    => "Conexión exitosa con Telegram. Mensaje de prueba enviado al Chat ID {$chatId} vía @{$botUsername} ({$botName}).",
            ]);
        }

        jsonSuccess([
            'success'    => true,
            'latency_ms' => $latencyMs,
            'message'    => "Token válido. Bot autenticado como @{$botUsername} ({$botName}). Recuerda configurar TELEGRAM_CHAT_ID para recibir alertas.",
        ]);
    }
}

