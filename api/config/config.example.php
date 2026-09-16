<?php
/**
 * iWE Dashboard API - Configuration Template
 * 
 * Copy this file to 'config.local.php' on your server or development environment
 * and configure your MySQL database credentials and Meta Graph API settings.
 */

return [
    // -------------------------------------------------------------------------
    // Application & Environment
    // -------------------------------------------------------------------------
    'app' => [
        'name'        => 'iWE Dashboard API',
        'env'         => 'production', // 'development' or 'production'
        'base_url'    => 'https://i-wildland.com/api',
        'cors_origins'=> [
            'https://i-wildland.com',
            'http://localhost:5173',
            'http://localhost:3000',
        ],
    ],

    // -------------------------------------------------------------------------
    // MySQL Database (Hostinger Native)
    // -------------------------------------------------------------------------
    'db' => [
        'host'     => getenv('DB_HOST') ?: 'localhost',
        'port'     => getenv('DB_PORT') ?: 3306,
        'database' => getenv('DB_NAME') ?: 'u123456789_iwe_db',
        'username' => getenv('DB_USER') ?: 'u123456789_iwe_user',
        'password' => getenv('DB_PASS') ?: 'YourStrongDbPasswordHere',
        'charset'  => 'utf8mb4',
    ],

    // -------------------------------------------------------------------------
    // Session & Security Settings
    // -------------------------------------------------------------------------
    'session' => [
        'name'            => 'iwe_session',
        'lifetime'        => 86400 * 7, // 7 days
        'cookie_httponly' => true,
        'cookie_secure'   => true,       // set to false for local HTTP dev
        'cookie_samesite' => 'Lax',
    ],

    // -------------------------------------------------------------------------
    // Media & Uploads
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Meta Graph API (Facebook & Instagram Sync)
    // -------------------------------------------------------------------------
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
