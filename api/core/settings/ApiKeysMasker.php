<?php
/**
 * iWE Dashboard API - API Keys Masker & Key Resolver
 * 
 * Handles obfuscation/masking of sensitive secrets for frontend rendering and logs,
 * validation of standard/custom environment variable names, and hierarchical credential resolution.
 */

declare(strict_types=1);

class ApiKeysMasker {
    public const STANDARD_KEYS_MAP = [
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
        'TELEGRAM_BOT_TOKEN'       => ['telegram', 'bot_token'],
        'TELEGRAM_CHAT_ID'         => ['telegram', 'chat_id'],
        'AI_TRANSLATION_PROVIDER'  => ['ai_translation', 'active_provider'],
        'OPENAI_API_KEY'           => ['openai', 'api_key'],
        'OPENAI_MODEL'             => ['openai', 'model'],
        'GEMINI_API_KEY'           => ['gemini', 'api_key'],
        'GEMINI_MODEL'             => ['gemini', 'model'],
        'ANTHROPIC_API_KEY'        => ['anthropic', 'api_key'],
        'ANTHROPIC_MODEL'          => ['anthropic', 'model'],
    ];

    /**
     * Obfuscates sensitive values: returns empty if empty, '••••' if <= 4 chars,
     * or '••••••••' + last 4 characters for longer secrets.
     */
    public static function maskValue(?string $val): string {
        if (empty($val)) {
            return '';
        }
        $len = strlen($val);
        if ($len <= 4) {
            return '••••';
        }
        return '••••••••' . substr($val, -4);
    }

    /**
     * Checks if key belongs to the system's standard service keys map.
     */
    public static function isStandardKey(string $keyName): bool {
        return array_key_exists($keyName, self::STANDARD_KEYS_MAP);
    }

    /**
     * Validates custom environment variable name format: uppercase letters, numbers, and underscores.
     */
    public static function isValidCustomKeyName(string $keyName): bool {
        return (bool)preg_match('/^[A-Z][A-Z0-9_]{1,63}$/', $keyName);
    }

    /**
     * Resolves a key's value hierarchically: local config -> app config -> getenv.
     */
    public static function resolveValue(string $keyName, array $localData, array $config = []): string {
        if (isset(self::STANDARD_KEYS_MAP[$keyName])) {
            [$section, $prop] = self::STANDARD_KEYS_MAP[$keyName];
            if (!empty($localData[$section][$prop])) {
                return (string)$localData[$section][$prop];
            }
            if (!empty($config[$section][$prop])) {
                return (string)$config[$section][$prop];
            }
        }
        $env = getenv($keyName);
        return $env !== false ? $env : '';
    }
}

