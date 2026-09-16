<?php
/**
 * iWE Dashboard API - Core Helpers
 * 
 * Common utility functions for JSON responses, authentication guards,
 * session management, CORS handling, and payload parsing.
 */

// -----------------------------------------------------------------------------
// Response Helpers
// -----------------------------------------------------------------------------

function jsonResponse($data, int $status = 200, array $headers = []): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    
    foreach ($headers as $header => $value) {
        header("$header: $value");
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonSuccess($data = null, string $message = '', int $status = 200): void {
    $payload = ['success' => true];
    if ($data !== null) {
        $payload['data'] = $data;
    }
    if ($message !== '') {
        $payload['message'] = $message;
    }
    jsonResponse($payload, $status);
}

function jsonError(string $message, int $status = 400, $details = null): void {
    $payload = [
        'success' => false,
        'error'   => $message,
    ];
    if ($details !== null) {
        $payload['details'] = $details;
    }
    jsonResponse($payload, $status);
}

// -----------------------------------------------------------------------------
// Request Helpers
// -----------------------------------------------------------------------------

function getRequestBody(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    
    return $_POST ?? [];
}

// -----------------------------------------------------------------------------
// Session & Auth Helpers
// -----------------------------------------------------------------------------

function startAppSession(array $config): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionConfig = $config['session'] ?? [];
    
    $name = $sessionConfig['name'] ?? 'iwe_session';
    $lifetime = $sessionConfig['lifetime'] ?? 86400 * 7;
    $secure = $sessionConfig['cookie_secure'] ?? (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
    $httponly = $sessionConfig['cookie_httponly'] ?? true;
    $samesite = $sessionConfig['cookie_samesite'] ?? 'Lax';

    session_name($name);
    
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => $httponly,
        'samesite' => $samesite,
    ]);

    session_start();
}

function getAuthenticatedUser(PDO $pdo): ?array {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    $userId = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare('SELECT id, email, display_name, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function requireAuth(PDO $pdo): array {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        jsonError('No autenticado. Se requiere una sesión activa para realizar esta acción.', 401);
    }
    return $user;
}

// -----------------------------------------------------------------------------
// String & Utility Helpers
// -----------------------------------------------------------------------------

function slugify(string $text): string {
    // Replace non letter or digits by -
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    // Transliterate
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    // Remove unwanted characters
    $text = preg_replace('~[^-\w]+~', '', $text);
    // Trim
    $text = trim($text, '-');
    // Remove duplicate -
    $text = preg_replace('~-+~', '-', $text);
    // Lowercase
    $text = strtolower($text);

    return empty($text) ? 'n-a-' . time() : $text;
}

function handleCors(array $config): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = $config['app']['cors_origins'] ?? ['*'];

    if (in_array('*', $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: *');
    } elseif ($origin && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Hub-Signature-256');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
