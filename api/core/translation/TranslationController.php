<?php
/**
 * iWE Dashboard API - AI Translation Controller (NVIDIA NIM)
 * 
 * Adapts OpenAI-compatible Chat Completions API from NVIDIA NIM (build.nvidia.com)
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

        $apiKey = trim($this->config['nvidia_nim']['api_key'] ?? '');
        if (empty($apiKey)) {
            jsonError('Traducción por IA no configurada. Configure la variable de entorno NVIDIA_NIM_API_KEY.', 503);
        }

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

        $systemPrompt = <<<PROMPT
Eres un traductor profesional y redactor turístico especializado en turismo activo, deportes de montaña y aventura en Andorra y los Pirineos para la agencia "Isard Wildland Experience" (iWE).
Tu misión es traducir con máxima naturalidad y fidelidad del {$sourceName} al {$targetName}.

Reglas de traducción indispensables:
1. Mantén un tono cercano, aventurero, dinámico pero profesional y pulcro.
2. NO traduzcas nombres propios, marcas o topónimos locales (por ejemplo: Grandvalira, Vallnord, Canillo, Forn de Canillo, La Cova, LLosada, Encamp, Arcalís, Tor, Claror, Pic Negre, Vall d'Incles, Jucla, Noguera Pallaresa, Charly Paredes, iWE, Isard Wildland Experience, Land Rover Defender, EFPEM, AADIDES, ISIA, UIMLA, AGAMA).
3. Devuelve EXCLUSIVAMENTE el texto traducido, sin explicaciones, sin saludos, sin comillas envolventes ni prefijos como "Traducción:".
PROMPT;

        $apiUrl = $this->config['nvidia_nim']['api_url'] ?? 'https://integrate.api.nvidia.com/v1/chat/completions';
        $model = $this->config['nvidia_nim']['model'] ?? 'meta/llama-3.1-70b-instruct';

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => "Traduce el siguiente contenido ({$fieldName}):\n\n{$text}"]
            ],
            'temperature' => 0.2,
            'max_tokens' => 1500,
        ];

        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("NVIDIA NIM cURL error: " . $curlError);
            jsonError('Error al comunicarse con el servicio de IA: ' . $curlError, 502);
        }

        if ($httpCode !== 200) {
            error_log("NVIDIA NIM API responded HTTP {$httpCode}: {$response}");
            $errData = json_decode((string)$response, true);
            $errMsg = $errData['error']['message'] ?? $errData['message'] ?? "Código HTTP {$httpCode}";
            jsonError("Error en el proveedor de IA ({$errMsg})", 502);
        }

        $responseData = json_decode((string)$response, true);
        $translated = trim($responseData['choices'][0]['message']['content'] ?? '');

        if (empty($translated)) {
            jsonError('El servicio de IA devolvió una respuesta vacía.', 500);
        }

        jsonSuccess([
            'translated_text' => $translated,
            'target_locale'   => $targetLocale,
            'source_locale'   => $sourceLocale,
            'model'           => $model,
        ], 'Traducción sugerida con éxito.');
    }
}

