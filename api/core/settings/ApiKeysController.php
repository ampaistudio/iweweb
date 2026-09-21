<?php
/**
 * iWE Dashboard API - Centralized API Keys Settings Controller
 * 
 * Manages configuration and API credentials storage in config.local.php outside version control.
 * Requires admin privileges for all operations.
 */

declare(strict_types=1);

require_once __DIR__ . '/ApiKeysMasker.php';
require_once __DIR__ . '/ApiKeysStorage.php';
require_once __DIR__ . '/ApiKeysRegistry.php';
require_once __DIR__ . '/ApiKeysConnectionTester.php';

class ApiKeysController {
    public const STANDARD_KEYS_MAP = ApiKeysMasker::STANDARD_KEYS_MAP;

    private PDO $pdo;
    private array $config;
    private ApiKeysStorage $storage;
    private ApiKeysConnectionTester $connectionTester;

    public function __construct(
        PDO $pdo,
        array $config,
        ?ApiKeysStorage $storage = null,
        ?ApiKeysConnectionTester $connectionTester = null
    ) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->storage = $storage ?? new ApiKeysStorage();
        $this->connectionTester = $connectionTester ?? new ApiKeysConnectionTester($this->config);
    }

    /**
     * GET /api/settings/api-keys
     * Returns obfuscated credentials status and metadata.
     */
    public function getKeys(): void {
        requireAdmin($this->pdo);

        $localData = $this->storage->readLocalConfigFile();
        $isWritable = $this->storage->isWritable();

        $services = ApiKeysRegistry::getServices($localData, $this->config);
        $customKeys = $this->storage->formatCustomKeys($localData);
        $activeProvider = ApiKeysRegistry::getActiveTranslationProvider($localData, $this->config);

        jsonSuccess([
            'services'                    => $services,
            'custom_keys'                 => $customKeys,
            'active_translation_provider' => $activeProvider,
            'storage_file'                => 'api/config/config.local.php',
            'is_writable'                 => $isWritable,
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

        $result = $this->storage->saveKey($keyName, $value, $description);

        jsonSuccess($result, 'Credencial guardada correctamente.');
    }

    /**
     * DELETE /api/settings/api-keys/:key_name
     * Deletes a generic custom key from config.local.php.
     */
    public function deleteCustomKey(string $keyName): void {
        requireAdmin($this->pdo);

        $cleanKeyName = trim($keyName);
        $this->storage->deleteCustomKey($cleanKeyName);
    }

    /**
     * POST /api/settings/api-keys/test
     * Performs a live minimal connection check to verify API key validity.
     */
    public function testConnection(): void {
        requireAdmin($this->pdo);

        $body = getRequestBody();
        $service = trim($body['service'] ?? '');

        $localData = $this->storage->readLocalConfigFile();
        $this->connectionTester->test($service, $localData);
    }

    // -------------------------------------------------------------------------
    // Backward-Compatibility Helpers
    // -------------------------------------------------------------------------

    private function resolveValue(string $keyName, array $localData): string {
        return ApiKeysMasker::resolveValue($keyName, $localData, $this->config);
    }

    private function maskValue(?string $val): string {
        return ApiKeysMasker::maskValue($val);
    }

    private function readLocalConfigFile(): array {
        return $this->storage->readLocalConfigFile();
    }

    private function writeLocalConfigFile(array $data): void {
        $this->storage->writeLocalConfigFile($data);
    }
}
