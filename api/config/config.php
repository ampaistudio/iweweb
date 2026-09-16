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
        'verify_token'      => getenv('META_VERIFY_TOKEN') ?: 'iwe_webhook_verify_token_secure_string',
        'api_version'       => 'v21.0',
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
