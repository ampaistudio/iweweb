<?php
/**
 * iWE Dashboard API - Central Configuration Loader
 */

// Load base configuration
$defaultConfig = [
    'app' => [
        'name'        => 'iWE Dashboard API',
        'env'         => getenv('APP_ENV') ?: 'production',
        'base_url'    => getenv('APP_BASE_URL') ?: '/api',
        'cors_origins'=> [
            'https://i-wildland.com',
            'http://localhost:5173',
            'http://localhost:3000',
        ],
    ],
    'db' => [
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: 3306,
        'database' => getenv('DB_NAME') ?: 'iwe_dashboard',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') ?: '',
        'charset'  => 'utf8mb4',
    ],
    'session' => [
        'name'            => 'iwe_session',
        'lifetime'        => 86400 * 7,
        'cookie_httponly' => true,
        'cookie_secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'cookie_samesite' => 'Lax',
    ],
    'media' => [
        'upload_dir'      => __DIR__ . '/../uploads',
        'public_path'     => '/api/uploads',
        'max_size_bytes'  => 8 * 1024 * 1024, // 8 MB
        'allowed_mimes'   => [
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png'  => ['png'],
            'image/webp' => ['webp'],
        ],
    ],
    'meta' => [
        'page_id'           => getenv('META_PAGE_ID') ?: '',
        'page_access_token' => getenv('META_PAGE_ACCESS_TOKEN') ?: '',
        'ig_user_id'        => getenv('META_IG_USER_ID') ?: '',
        'app_id'            => getenv('META_APP_ID') ?: '',
        'app_secret'        => getenv('META_APP_SECRET') ?: '',
        'verify_token'      => getenv('META_VERIFY_TOKEN') ?: '',
        'api_version'       => 'v21.0',
    ],
    'ai_translation' => [
        'active_provider' => getenv('AI_TRANSLATION_PROVIDER') ?: 'nvidia_nim',
    ],
    'nvidia_nim' => [
        'api_key' => getenv('NVIDIA_NIM_API_KEY') ?: '',
        'api_url' => getenv('NVIDIA_NIM_API_URL') ?: 'https://integrate.api.nvidia.com/v1/chat/completions',
        'model'   => getenv('NVIDIA_NIM_MODEL') ?: 'meta/llama-3.1-70b-instruct',
    ],
    'openai' => [
        'api_key' => getenv('OPENAI_API_KEY') ?: '',
        'model'   => getenv('OPENAI_MODEL') ?: 'gpt-4o-mini',
    ],
    'gemini' => [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model'   => getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash',
    ],
    'anthropic' => [
        'api_key' => getenv('ANTHROPIC_API_KEY') ?: '',
        'model'   => getenv('ANTHROPIC_MODEL') ?: 'claude-3-5-haiku-20241022',
    ],
    /**
     * Google Places API Integration
     * Business CID: 0x364c511f18f0fa2c ("Isard Wildland" in Google Maps)
     * NOTE: Requires GOOGLE_PLACES_API_KEY and Place ID (resolved from CID) in config.local.php or env.
     */
    'google_places' => [
        'api_key'  => getenv('GOOGLE_PLACES_API_KEY') ?: '',
        'place_id' => getenv('GOOGLE_PLACE_ID') ?: '',
        'cid'      => '0x364c511f18f0fa2c',
    ],
    /**
     * TripAdvisor Content API Integration
     * Business Location ID: d18719120 ("IWE" in TripAdvisor Andorra)
     * NOTE: Requires TRIPADVISOR_API_KEY (partner approval required) in config.local.php or env.
     */
    'tripadvisor' => [
        'api_key'     => getenv('TRIPADVISOR_API_KEY') ?: '',
        'location_id' => getenv('TRIPADVISOR_LOCATION_ID') ?: 'd18719120',
    ],
    /**
     * Telegram Bot API Integration (Site Health Alerts)
     */
    'telegram' => [
        'bot_token' => getenv('TELEGRAM_BOT_TOKEN') ?: '',
        'chat_id'   => getenv('TELEGRAM_CHAT_ID') ?: '',
    ],
];

// Check for local overrides file (outside version control)
$localConfigFile = __DIR__ . '/config.local.php';
if (file_exists($localConfigFile)) {
    $localConfig = require $localConfigFile;
    if (is_array($localConfig)) {
        $config = array_replace_recursive($defaultConfig, $localConfig);
    } else {
        $config = $defaultConfig;
    }
} else {
    $config = $defaultConfig;
}

return $config;
