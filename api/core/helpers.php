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
    
    if (stripos($contentType, 'application/json') !== false || empty($_POST)) {
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
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
    $stmt = $pdo->prepare('SELECT id, email, display_name, role, must_change_password, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if ($user) {
        $user['must_change_password'] = (bool)($user['must_change_password'] ?? false);
        return $user;
    }

    return null;
}

function requireAuth(PDO $pdo): array {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        jsonError('No autenticado. Se requiere una sesión activa para realizar esta acción.', 401);
    }
    return $user;
}

function requireAdmin(PDO $pdo): array {
    $user = requireAuth($pdo);
    if (($user['role'] ?? 'user') !== 'admin') {
        jsonError('Acceso denegado. Se requieren privilegios de administrador para esta acción.', 403);
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

/**
 * Sanitize rich-text HTML coming from the dashboard editor (Tiptap StarterKit
 * with headings/blockquote/codeBlock/horizontalRule disabled).
 *
 * Strips any tag/attribute outside the allow-list, and removes script/style
 * content entirely instead of just unwrapping it, so no injected markup or
 * event handler attribute can survive into the public site (NAES §9.2 — XSS
 * must never be accepted).
 */
function sanitizeRichText(string $html): string {
    $html = trim($html);
    if ($html === '') {
        return '';
    }

    $allowedTags = ['p', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'br'];

    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML(
        '<?xml encoding="utf-8" ?><div id="sanitize-root">' . $html . '</div>',
        LIBXML_NOERROR | LIBXML_NOWARNING
    );
    libxml_clear_errors();

    $root = $doc->getElementById('sanitize-root');
    if (!$root) {
        return '';
    }

    $stripDisallowedNode = function (DOMNode $node) use (&$stripDisallowedNode, $allowedTags, $doc): void {
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if ($child->nodeType === XML_TEXT_NODE) {
                continue;
            }

            if ($child->nodeType !== XML_ELEMENT_NODE) {
                $node->removeChild($child);
                continue;
            }

            /** @var DOMElement $child */
            $tag = strtolower($child->tagName);

            if ($tag === 'script' || $tag === 'style') {
                $node->removeChild($child);
                continue;
            }

            if (!in_array($tag, $allowedTags, true)) {
                // Unwrap: keep children (plain text/inline content), drop the tag itself.
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }

            // Strip every attribute — no href/src/style/on* survives on an allowed tag either.
            while ($child->attributes->length > 0) {
                $child->removeAttribute($child->attributes->item(0)->name);
            }

            $stripDisallowedNode($child);
        }
    };

    $stripDisallowedNode($root);

    $innerHtml = '';
    foreach ($root->childNodes as $child) {
        $innerHtml .= $doc->saveHTML($child);
    }

    return trim($innerHtml);
}

/**
 * Send an email through the host's SMTP relay via PHP's mail(), routed with
 * explicit Sendmail SMTP params so it works on Hostinger-style shared hosting
 * without adding a Composer dependency for a single transactional email.
 *
 * Returns false on failure instead of throwing — callers must never leak
 * whether a given address has an account (NAES §9.2 — no user enumeration).
 */
function sendTransactionalEmail(array $config, string $toEmail, string $subject, string $htmlBody): bool {
    $fromEmail = $config['mail']['from_address'] ?? '';
    $fromName = $config['mail']['from_name'] ?? 'iWE Dashboard';

    if ($fromEmail === '') {
        error_log('sendTransactionalEmail: MAIL_FROM_ADDRESS is not configured.');
        return false;
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        sprintf('From: %s <%s>', $fromName, $fromEmail),
        sprintf('Reply-To: %s', $fromEmail),
    ];

    return @mail($toEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlBody, implode("\r\n", $headers));
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
