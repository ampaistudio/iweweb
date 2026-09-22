<?php
/**
 * iWE Dashboard API - AI Translation Controller (Multi-Provider)
 * 
 * Supports NVIDIA NIM, OpenAI, Google Gemini, and Anthropic Claude
 * for tourism content translation (ES -> CA, EN, FR).
 */

declare(strict_types=1);

class TranslationController {
    private PDO $pdo;
    private array $config;

    public const SUPPORTED_TARGET_LOCALES = ['ca', 'en', 'fr'];
    public const LOCALE_NAMES = [
        'ca' => 'catalán',
        'en' => 'inglés',
        'fr' => 'francés',
        'es' => 'español',
    ];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * POST /api/translate
     * Body: { "text": "...", "target_locale": "ca|en|fr", "source_locale": "es", "field_name": "title|description|..." }
     */
    public function translate(): void {
        requireAuth($this->pdo);

        $body = getRequestBody();
        $text = trim((string)($body['text'] ?? ''));
        $targetLocale = strtolower(trim((string)($body['target_locale'] ?? '')));
        $sourceLocale = strtolower(trim((string)($body['source_locale'] ?? 'es')));
        $fieldName = trim((string)($body['field_name'] ?? 'texto general'));

        if (empty($text)) {
            jsonError('El texto a traducir es obligatorio.', 422);
        }

        if (!in_array($targetLocale, self::SUPPORTED_TARGET_LOCALES, true)) {
            $allowed = implode(', ', self::SUPPORTED_TARGET_LOCALES);
            jsonError("Idioma destino no soportado '{$targetLocale}'. Permitidos: {$allowed}", 422);
        }

        $targetName = self::LOCALE_NAMES[$targetLocale] ?? $targetLocale;
        $sourceName = self::LOCALE_NAMES[$sourceLocale] ?? $sourceLocale;

        $domainContext = $this->config['ai_translation']['domain_context'] ?? 'turismo activo y deportes de aventura';
        $protectedTermsList = $this->config['ai_translation']['protected_terms'] ?? [];
        $protectedTermsStr = !empty($protectedTermsList) ? implode(', ', $protectedTermsList) : '';
        $ruleToponyms = !empty($protectedTermsStr)
            ? "2. NO traduzcas nombres propios, marcas o topónimos locales (por ejemplo: {$protectedTermsStr})."
            : "2. NO traduzcas nombres propios, marcas o topónimos locales.";

        $systemPrompt = <<<PROMPT
Eres un traductor profesional y redactor especializado en {$domainContext}.
Tu misión es traducir con máxima naturalidad y fidelidad del {$sourceName} al {$targetName}.

Reglas de traducción indispensables:
1. Mantén un tono cercano, aventurero, dinámico pero profesional y pulcro.
{$ruleToponyms}
3. Devuelve EXCLUSIVAMENTE el texto traducido, sin explicaciones, sin saludos, sin comillas envolventes ni prefijos como "Traducción:".
PROMPT;

        $userPrompt = "Traduce el siguiente contenido ({$fieldName}):\n\n{$text}";

        $provider = $this->config['ai_translation']['active_provider'] ?? 'nvidia_nim';

        switch ($provider) {
            case 'openai':
                $this->translateWithOpenAi($systemPrompt, $userPrompt, $targetLocale, $sourceLocale);
                break;
            case 'gemini':
                $this->translateWithGemini($systemPrompt, $userPrompt, $targetLocale, $sourceLocale);
                break;
            case 'anthropic':
                $this->translateWithAnthropic($systemPrompt, $userPrompt, $targetLocale, $sourceLocale);
                break;
            case 'nvidia_nim':
            default:
                $this->translateWithNvidiaNim($systemPrompt, $userPrompt, $targetLocale, $sourceLocale);
                break;
        }
    }

    private function translateWithNvidiaNim(string $systemPrompt, string $userPrompt, string $targetLocale, string $sourceLocale): void {
        $apiKey = trim($this->config['nvidia_nim']['api_key'] ?? '');
        if (empty($apiKey)) {
            jsonError('Traducción por IA no configurada. Configure NVIDIA_NIM_API_KEY en Integraciones & API Keys.', 503);
        }

        $apiUrl = $this->config['nvidia_nim']['api_url'] ?: 'https://integrate.api.nvidia.com/v1/chat/completions';
        $model = $this->config['nvidia_nim']['model'] ?: 'meta/llama-3.1-70b-instruct';

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt]
            ],
            'temperature' => 0.2,
            'max_tokens' => 1500,
        ];

        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            jsonError('Error al comunicarse con NVIDIA NIM: ' . $curlError, 502);
        }

        if ($httpCode !== 200) {
            $errData = json_decode((string)$response, true);
            $errMsg = $errData['error']['message'] ?? $errData['message'] ?? "Código HTTP {$httpCode}";
            jsonError("Error en NVIDIA NIM ({$errMsg})", 502);
        }

        $responseData = json_decode((string)$response, true);
        $translated = trim($responseData['choices'][0]['message']['content'] ?? '');

        if (empty($translated)) {
            jsonError('El servicio de NVIDIA NIM devolvió una respuesta vacía.', 500);
        }

        jsonSuccess([
            'translated_text' => $translated,
            'target_locale'   => $targetLocale,
            'source_locale'   => $sourceLocale,
            'provider'        => 'nvidia_nim',
            'model'           => $model,
        ], 'Traducción generada con NVIDIA NIM.');
    }

    private function translateWithOpenAi(string $systemPrompt, string $userPrompt, string $targetLocale, string $sourceLocale): void {
        $apiKey = trim($this->config['openai']['api_key'] ?? '');
        if (empty($apiKey)) {
            jsonError('Traducción por IA no configurada. Configure OPENAI_API_KEY en Integraciones & API Keys.', 503);
        }

        $model = $this->config['openai']['model'] ?: 'gpt-4o-mini';

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt]
            ],
            'temperature' => 0.2,
            'max_tokens' => 1500,
        ];

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            jsonError('Error al comunicarse con OpenAI: ' . $curlError, 502);
        }

        if ($httpCode !== 200) {
            $errData = json_decode((string)$response, true);
            $errMsg = $errData['error']['message'] ?? "Código HTTP {$httpCode}";
            jsonError("Error en OpenAI ({$errMsg})", 502);
        }

        $responseData = json_decode((string)$response, true);
        $translated = trim($responseData['choices'][0]['message']['content'] ?? '');

        if (empty($translated)) {
            jsonError('El servicio de OpenAI devolvió una respuesta vacía.', 500);
        }

        jsonSuccess([
            'translated_text' => $translated,
            'target_locale'   => $targetLocale,
            'source_locale'   => $sourceLocale,
            'provider'        => 'openai',
            'model'           => $model,
        ], 'Traducción generada con OpenAI.');
    }

    private function translateWithGemini(string $systemPrompt, string $userPrompt, string $targetLocale, string $sourceLocale): void {
        $apiKey = trim($this->config['gemini']['api_key'] ?? '');
        if (empty($apiKey)) {
            jsonError('Traducción por IA no configurada. Configure GEMINI_API_KEY en Integraciones & API Keys.', 503);
        }

        $model = $this->config['gemini']['model'] ?: 'gemini-1.5-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]]
            ],
            'contents' => [
                ['parts' => [['text' => $userPrompt]]]
            ],
            'generationConfig' => [
                'temperature'     => 0.2,
                'maxOutputTokens' => 1500,
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            jsonError('Error al comunicarse con Google Gemini: ' . $curlError, 502);
        }

        if ($httpCode !== 200) {
            $errData = json_decode((string)$response, true);
            $errMsg = $errData['error']['message'] ?? "Código HTTP {$httpCode}";
            jsonError("Error en Google Gemini ({$errMsg})", 502);
        }

        $responseData = json_decode((string)$response, true);
        $translated = trim($responseData['candidates'][0]['content']['parts'][0]['text'] ?? '');

        if (empty($translated)) {
            jsonError('Google Gemini devolvió una respuesta vacía.', 500);
        }

        jsonSuccess([
            'translated_text' => $translated,
            'target_locale'   => $targetLocale,
            'source_locale'   => $sourceLocale,
            'provider'        => 'gemini',
            'model'           => $model,
        ], 'Traducción generada con Google Gemini.');
    }

    private function translateWithAnthropic(string $systemPrompt, string $userPrompt, string $targetLocale, string $sourceLocale): void {
        $apiKey = trim($this->config['anthropic']['api_key'] ?? '');
        if (empty($apiKey)) {
            jsonError('Traducción por IA no configurada. Configure ANTHROPIC_API_KEY en Integraciones & API Keys.', 503);
        }

        $model = $this->config['anthropic']['model'] ?: 'claude-3-5-haiku-20241022';

        $payload = [
            'model'       => $model,
            'system'      => $systemPrompt,
            'messages'    => [
                ['role' => 'user', 'content' => $userPrompt]
            ],
            'temperature' => 0.2,
            'max_tokens'  => 1500,
        ];

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . $apiKey,
                'anthropic-version: 2023-06-01',
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            jsonError('Error al comunicarse con Anthropic Claude: ' . $curlError, 502);
        }

        if ($httpCode !== 200) {
            $errData = json_decode((string)$response, true);
            $errMsg = $errData['error']['message'] ?? "Código HTTP {$httpCode}";
            jsonError("Error en Anthropic Claude ({$errMsg})", 502);
        }

        $responseData = json_decode((string)$response, true);
        $translated = trim($responseData['content'][0]['text'] ?? '');

        if (empty($translated)) {
            jsonError('Anthropic Claude devolvió una respuesta vacía.', 500);
        }

        jsonSuccess([
            'translated_text' => $translated,
            'target_locale'   => $targetLocale,
            'source_locale'   => $sourceLocale,
            'provider'        => 'anthropic',
            'model'           => $model,
        ], 'Traducción generada con Anthropic Claude.');
    }
}
