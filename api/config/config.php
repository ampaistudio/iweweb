<?php
/**
 * iWE Dashboard API - Central Configuration Loader
 */

// Load base configuration
$defaultConfig = [
    'app' => [
        'name'        => 'iWE Dashboard API',
        'env'         => getenv('APP_ENV') ?: 'production',
        'site_url'    => getenv('APP_SITE_URL') ?: '',
        'base_url'    => getenv('APP_BASE_URL') ?: '/api',
        'panel_slug'  => getenv('APP_PANEL_SLUG') ?: null,
        'panel_dir'   => 'admin-panel',
        'cors_origins'=> array_values(array_filter([
            getenv('APP_SITE_URL') ?: null,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
        ])),
    ],
    'seo' => [
        'default_og_image' => getenv('SEO_DEFAULT_OG_IMAGE') ?: '',
    ],
    'db' => [
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: 3306,
        'database' => getenv('DB_NAME') ?: 'iwe_dashboard',
        'username' => getenv('DB_USER') !== false ? getenv('DB_USER') : null,
        'password' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : null,
        'charset'  => 'utf8mb4',
    ],
    'session' => [
        'name'            => 'iwe_session',
        'lifetime'        => 86400 * 7,
        'cookie_httponly' => true,
        'cookie_secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'cookie_samesite' => 'Lax',
    ],
    'mail' => [
        // Hostinger's shared-hosting mail() relay is used instead of external SMTP
        // credentials; the box only needs a From address it's allowed to send as.
        'from_address' => getenv('MAIL_FROM_ADDRESS') ?: '',
        'from_name'    => getenv('MAIL_FROM_NAME') ?: 'iWE Dashboard',
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
        'domain_context'  => getenv('AI_TRANSLATION_DOMAIN_CONTEXT') ?: 'turismo activo, deportes de montaña y aventura en Andorra y los Pirineos para la agencia "Isard Wildland Experience" (iWE)',
        'protected_terms' => [
            'Grandvalira', 'Vallnord', 'Canillo', 'Forn de Canillo', 'La Cova', 'LLosada',
            'Encamp', 'Arcalís', 'Tor', 'Claror', 'Pic Negre', 'Vall d\'Incles', 'Jucla',
            'Noguera Pallaresa', 'Charly Paredes', 'iWE', 'Isard Wildland Experience',
            'Land Rover Defender', 'EFPEM', 'AADIDES', 'ISIA', 'UIMLA', 'AGAMA',
        ],
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
     * NOTE: Requires GOOGLE_PLACES_API_KEY and Place ID (or CID) in config.local.php or env.
     */
    'google_places' => [
        'api_key'  => getenv('GOOGLE_PLACES_API_KEY') ?: '',
        'place_id' => getenv('GOOGLE_PLACE_ID') ?: '',
        'cid'      => getenv('GOOGLE_PLACES_CID') ?: '',
    ],
    /**
     * TripAdvisor Content API Integration
     * NOTE: Requires TRIPADVISOR_API_KEY and location_id in config.local.php or env.
     */
    'tripadvisor' => [
        'api_key'     => getenv('TRIPADVISOR_API_KEY') ?: '',
        'location_id' => getenv('TRIPADVISOR_LOCATION_ID') ?: '',
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

// NAES §8.4 / SEC-02: Require site_url / APP_SITE_URL to be explicitly configured
if (empty($config['app']['site_url'])) {
    throw new \RuntimeException('Configuration error: site_url / APP_SITE_URL is not configured.');
}

// NAES §8.4 / SEC-02: Explicit failure if critical database credentials are not configured
if (empty($config['db']['username'])) {
    throw new \RuntimeException('Database configuration error: DB_USER is not configured. Set DB_USER environment variable or configure db.username in config.local.php.');
}
if (!isset($config['db']['password']) || $config['db']['password'] === null) {
    throw new \RuntimeException('Database configuration error: DB_PASS is not configured. Set DB_PASS environment variable or configure db.password in config.local.php.');
}

return $config;
