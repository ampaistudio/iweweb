<?php
/**
 * iWE Dashboard API - Centralized API Keys Settings Controller
 * 
 * Manages configuration and API credentials storage in config.local.php outside version control.
 * Requires admin privileges for all operations.
 */

class ApiKeysController {
    private PDO $pdo;
    private array $config;
    private string $localConfigFile;

    private const STANDARD_KEYS_MAP = [
        'NVIDIA_NIM_API_KEY'       => ['nvidia_nim', 'api_key'],
        'NVIDIA_NIM_API_URL'       => ['nvidia_nim', 'api_url'],
        'NVIDIA_NIM_MODEL'         => ['nvidia_nim', 'model'],
        'META_PAGE_ID'             => ['meta', 'page_id'],
        'META_PAGE_ACCESS_TOKEN'   => ['meta', 'page_access_token'],
        'META_IG_USER_ID'          => ['meta', 'ig_user_id'],
        'META_APP_ID'              => ['meta', 'app_id'],
        'META_APP_SECRET'          => ['meta', 'app_secret'],
        'META_VERIFY_TOKEN'        => ['meta', 'verify_token'],
        'GOOGLE_PLACES_API_KEY'    => ['google_places', 'api_key'],
        'GOOGLE_PLACE_ID'          => ['google_places', 'place_id'],
        'TRIPADVISOR_API_KEY'      => ['tripadvisor', 'api_key'],
        'TRIPADVISOR_LOCATION_ID'  => ['tripadvisor', 'location_id'],
    ];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->localConfigFile = __DIR__ . '/../../config/config.local.php';
    }

    /**
     * GET /api/settings/api-keys
     * Returns obfuscated credentials status and metadata.
     */
    public function getKeys(): void {
        requireAdmin($this->pdo);

        $localData = $this->readLocalConfigFile();
        $configDir = dirname($this->localConfigFile);
        $isWritable = is_writable($configDir) && (!file_exists($this->localConfigFile) || is_writable($this->localConfigFile));

        $services = [
            'nvidia_nim' => [
                'id'          => 'nvidia_nim',
                'title'       => 'NVIDIA NIM (Traducción con IA)',
                'description' => 'Motor de inferencia de IA para las traducciones automáticas del CMS a Catalán, Inglés y Francés.',
                'docs_url'    => 'https://build.nvidia.com',
                'keys'        => [
                    [
                        'key_name'      => 'NVIDIA_NIM_API_KEY',
                        'label'         => 'API Key de NVIDIA NIM',
                        'is_required'   => true,
                        'is_configured' => !empty($this->resolveValue('NVIDIA_NIM_API_KEY', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('NVIDIA_NIM_API_KEY', $localData)),
                        'description'   => 'Clave de acceso obtenida gratuitamente en build.nvidia.com.',
                    ],
                    [
                        'key_name'      => 'NVIDIA_NIM_API_URL',
                        'label'         => 'Endpoint URL de la API',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('NVIDIA_NIM_API_URL', $localData)),
                        'masked_value'  => $this->resolveValue('NVIDIA_NIM_API_URL', $localData) ?: 'https://integrate.api.nvidia.com/v1/chat/completions',
                        'description'   => 'URL del endpoint de inferencia (por defecto NVIDIA OpenSearch / chat/completions).',
                    ],
                    [
                        'key_name'      => 'NVIDIA_NIM_MODEL',
                        'label'         => 'Modelo LLM',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('NVIDIA_NIM_MODEL', $localData)),
                        'masked_value'  => $this->resolveValue('NVIDIA_NIM_MODEL', $localData) ?: 'meta/llama-3.1-70b-instruct',
                        'description'   => 'Identificador del modelo de lenguaje para traducir (meta/llama-3.1-70b-instruct).',
                    ],
                ],
            ],
            'meta' => [
                'id'          => 'meta',
                'title'       => 'Meta / Facebook / Instagram',
                'description' => 'Credenciales oficiales de Meta Graph API para sincronizar publicaciones y webhooks en tiempo real.',
                'docs_url'    => 'https://developers.facebook.com/apps',
                'keys'        => [
                    [
                        'key_name'      => 'META_PAGE_ID',
                        'label'         => 'Page ID (Facebook)',
                        'is_required'   => true,
                        'is_configured' => !empty($this->resolveValue('META_PAGE_ID', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_PAGE_ID', $localData)),
                        'description'   => 'Identificador numérico de la página oficial de Facebook.',
                    ],
                    [
                        'key_name'      => 'META_PAGE_ACCESS_TOKEN',
                        'label'         => 'Page Access Token (Larga duración)',
                        'is_required'   => true,
                        'is_configured' => !empty($this->resolveValue('META_PAGE_ACCESS_TOKEN', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_PAGE_ACCESS_TOKEN', $localData)),
                        'description'   => 'Token de acceso a la página con permisos pages_show_list, instagram_basic.',
                    ],
                    [
                        'key_name'      => 'META_IG_USER_ID',
                        'label'         => 'Instagram Business User ID',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('META_IG_USER_ID', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_IG_USER_ID', $localData)),
                        'description'   => 'Identificador de la cuenta profesional de Instagram conectada a la página.',
                    ],
                    [
                        'key_name'      => 'META_APP_ID',
                        'label'         => 'App ID',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('META_APP_ID', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_APP_ID', $localData)),
                        'description'   => 'ID de la aplicación en Meta for Developers.',
                    ],
                    [
                        'key_name'      => 'META_APP_SECRET',
                        'label'         => 'App Secret',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('META_APP_SECRET', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_APP_SECRET', $localData)),
                        'description'   => 'Secreto de la aplicación en Meta for Developers.',
                    ],
                    [
                        'key_name'      => 'META_VERIFY_TOKEN',
                        'label'         => 'Webhook Verify Token',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('META_VERIFY_TOKEN', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('META_VERIFY_TOKEN', $localData)),
                        'description'   => 'Cadena secreta personalizada para validar el handshake de Webhooks de Meta.',
                    ],
                ],
            ],
            'google_places' => [
                'id'          => 'google_places',
                'title'       => 'Google Places (Reseñas Google Maps)',
                'description' => 'API de Google Maps Platform para consultar y sincronizar reseñas reales del negocio.',
                'docs_url'    => 'https://console.cloud.google.com/google/maps-apis',
                'keys'        => [
                    [
                        'key_name'      => 'GOOGLE_PLACES_API_KEY',
                        'label'         => 'Google Places API Key',
                        'is_required'   => true,
                        'is_configured' => !empty($this->resolveValue('GOOGLE_PLACES_API_KEY', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('GOOGLE_PLACES_API_KEY', $localData)),
                        'description'   => 'API Key de Google Cloud con Places API habilitada.',
                    ],
                    [
                        'key_name'      => 'GOOGLE_PLACE_ID',
                        'label'         => 'Place ID de Google Maps',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('GOOGLE_PLACE_ID', $localData)),
                        'masked_value'  => $this->resolveValue('GOOGLE_PLACE_ID', $localData) ?: 'CID: 0x364c511f18f0fa2c',
                        'description'   => 'Identificador del local en Google Maps (Place ID ChIJ... o resuelto por CID).',
                    ],
                ],
            ],
            'tripadvisor' => [
                'id'          => 'tripadvisor',
                'title'       => 'TripAdvisor Content API',
                'description' => 'API oficial de TripAdvisor para obtener valoraciones y opiniones verificadas.',
                'docs_url'    => 'https://developer-tripadvisor.com',
                'keys'        => [
                    [
                        'key_name'      => 'TRIPADVISOR_API_KEY',
                        'label'         => 'TripAdvisor API Key',
                        'is_required'   => true,
                        'is_configured' => !empty($this->resolveValue('TRIPADVISOR_API_KEY', $localData)),
                        'masked_value'  => $this->maskValue($this->resolveValue('TRIPADVISOR_API_KEY', $localData)),
                        'description'   => 'Clave de partner autorizada de TripAdvisor Content API.',
                    ],
                    [
                        'key_name'      => 'TRIPADVISOR_LOCATION_ID',
                        'label'         => 'Location ID',
                        'is_required'   => false,
                        'is_configured' => !empty($this->resolveValue('TRIPADVISOR_LOCATION_ID', $localData)),
                        'masked_value'  => $this->resolveValue('TRIPADVISOR_LOCATION_ID', $localData) ?: 'd18719120',
                        'description'   => 'Identificador de ubicación de iWE en TripAdvisor (d18719120).',
                    ],
                ],
            ],
        ];

        // Format custom generic credentials
        $customKeys = [];
        if (!empty($localData['custom_keys']) && is_array($localData['custom_keys'])) {
            foreach ($localData['custom_keys'] as $name => $item) {
                $val = is_array($item) ? ($item['value'] ?? '') : (string)$item;
                $desc = is_array($item) ? ($item['description'] ?? '') : '';
                $updatedAt = is_array($item) ? ($item['updated_at'] ?? '') : '';

                $customKeys[] = [
                    'key_name'      => $name,
                    'is_configured' => !empty($val),
                    'masked_value'  => $this->maskValue($val),
                    'description'   => $desc,
                    'updated_at'    => $updatedAt,
                ];
            }
        }

        jsonSuccess([
            'services'     => array_values($services),
            'custom_keys'  => $customKeys,
            'storage_file' => 'api/config/config.local.php',
            'is_writable'  => $isWritable,
        ]);
    }

    /**
     * POST /api/settings/api-keys
     * Atomically saves or updates a standard or custom key in config.local.php.
     */
    public function saveKey(): void {
        requireAdmin($this->pdo);

        $body = getRequestBody();
        $keyName = trim($body['key_name'] ?? '');
        $value = trim($body['value'] ?? '');
        $description = trim($body['description'] ?? '');

        if (empty($keyName)) {
            jsonError('El nombre de la variable (key_name) es obligatorio.', 422);
        }

        // Check if key_name is valid (standard whitelist OR valid env var format)
        $isStandard = array_key_exists($keyName, self::STANDARD_KEYS_MAP);
        if (!$isStandard) {
            if (!preg_match('/^[A-Z][A-Z0-9_]{1,63}$/', $keyName)) {
                jsonError('El nombre de la variable personalizada no es válido. Debe usar mayúsculas, números o guiones bajos (ej: TELEGRAM_BOT_TOKEN).', 422);
            }
        }

        $localData = $this->readLocalConfigFile();

        if ($isStandard) {
            [$section, $prop] = self::STANDARD_KEYS_MAP[$keyName];
            if (!isset($localData[$section]) || !is_array($localData[$section])) {
                $localData[$section] = [];
            }
            $localData[$section][$prop] = $value;
        } else {
            if (!isset($localData['custom_keys']) || !is_array($localData['custom_keys'])) {
                $localData['custom_keys'] = [];
            }
            $localData['custom_keys'][$keyName] = [
                'value'       => $value,
                'description' => $description,
                'updated_at'  => date('Y-m-d H:i:s'),
            ];
        }

        $this->writeLocalConfigFile($localData);

        jsonSuccess([
            'key_name'      => $keyName,
            'is_configured' => !empty($value),
            'masked_value'  => $this->maskValue($value),
        ], 'Credencial guardada correctamente.');
    }

    /**
     * DELETE /api/settings/api-keys/:key_name
     * Deletes a generic custom key from config.local.php.
     */
    public function deleteCustomKey(string $keyName): void {
        requireAdmin($this->pdo);

        $keyName = trim($keyName);
        if (array_key_exists($keyName, self::STANDARD_KEYS_MAP)) {
            jsonError('Las credenciales estándar del sistema no pueden eliminarse, únicamente vaciarse.', 400);
        }

        $localData = $this->readLocalConfigFile();
        if (isset($localData['custom_keys'][$keyName])) {
            unset($localData['custom_keys'][$keyName]);
            $this->writeLocalConfigFile($localData);
            jsonSuccess(null, "Credencial '{$keyName}' eliminada correctamente.");
        } else {
            jsonError("La credencial '{$keyName}' no existe.", 404);
        }
    }

    /**
     * POST /api/settings/api-keys/test
     * Performs a live minimal connection check to verify API key validity.
     */
    public function testConnection(): void {
        requireAdmin($this->pdo);

        $body = getRequestBody();
        $service = trim($body['service'] ?? '');

        $localData = $this->readLocalConfigFile();

        switch ($service) {
            case 'nvidia_nim':
                $this->testNvidiaNim($localData);
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
            default:
                jsonError("Servicio de prueba '{$service}' no reconocido.", 422);
        }
    }

    // -------------------------------------------------------------------------
    // Service Specific Live Connection Tests
    // -------------------------------------------------------------------------

    private function testNvidiaNim(array $localData): void {
        $apiKey = $this->resolveValue('NVIDIA_NIM_API_KEY', $localData);
        $apiUrl = $this->resolveValue('NVIDIA_NIM_API_URL', $localData) ?: 'https://integrate.api.nvidia.com/v1/chat/completions';
        $model = $this->resolveValue('NVIDIA_NIM_MODEL', $localData) ?: 'meta/llama-3.1-70b-instruct';

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
            $parsed = json_decode($response, true);
            $msg = $parsed['error']['message'] ?? $parsed['detail'] ?? "HTTP {$httpCode}";
            jsonError("Error de autenticación con NVIDIA NIM ({$httpCode}): {$msg}", 400);
        }
    }

    private function testMeta(array $localData): void {
        $token = $this->resolveValue('META_PAGE_ACCESS_TOKEN', $localData);
        $pageId = $this->resolveValue('META_PAGE_ID', $localData);

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

        $data = json_decode($response, true);
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
        $apiKey = $this->resolveValue('GOOGLE_PLACES_API_KEY', $localData);

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

        $data = json_decode($response, true);
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
        $apiKey = $this->resolveValue('TRIPADVISOR_API_KEY', $localData);
        $locationId = $this->resolveValue('TRIPADVISOR_LOCATION_ID', $localData) ?: 'd18719120';

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
            $data = json_decode($response, true);
            $msg = $data['error']['message'] ?? "HTTP {$httpCode}";
            jsonError("Error de TripAdvisor API ({$httpCode}): {$msg}", 400);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers for file reading, writing and masking
    // -------------------------------------------------------------------------

    private function resolveValue(string $keyName, array $localData): string {
        if (isset(self::STANDARD_KEYS_MAP[$keyName])) {
            [$section, $prop] = self::STANDARD_KEYS_MAP[$keyName];
            if (!empty($localData[$section][$prop])) {
                return (string)$localData[$section][$prop];
            }
            if (!empty($this->config[$section][$prop])) {
                return (string)$this->config[$section][$prop];
            }
        }
        $env = getenv($keyName);
        return $env !== false ? $env : '';
    }

    private function maskValue(?string $val): string {
        if (empty($val)) return '';
        $len = strlen($val);
        if ($len <= 4) return '••••';
        return '••••••••' . substr($val, -4);
    }

    private function readLocalConfigFile(): array {
        if (file_exists($this->localConfigFile)) {
            $data = require $this->localConfigFile;
            if (is_array($data)) {
                return $data;
            }
        }
        return [];
    }

    private function writeLocalConfigFile(array $data): void {
        $dir = dirname($this->localConfigFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $content = "<?php\n/**\n * iWE Dashboard - Local Configuration & API Keys Override\n * Auto-generated by ApiKeysController\n */\n\nreturn " . var_export($data, true) . ";\n";

        // Atomic write: temp file + rename
        $tempFile = tempnam($dir, 'cfg_tmp_');
        if ($tempFile === false) {
            jsonError('No se pudo crear el archivo temporal de configuración.', 500);
        }

        if (file_put_contents($tempFile, $content) === false) {
            @unlink($tempFile);
            jsonError('Error al escribir el archivo temporal de configuración.', 500);
        }

        chmod($tempFile, 0644);

        if (!rename($tempFile, $this->localConfigFile)) {
            @unlink($tempFile);
            jsonError('Error al reemplazar el archivo de configuración atómico.', 500);
        }
    }
}
