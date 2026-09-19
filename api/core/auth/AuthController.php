<?php
/**
 * iWE Dashboard API - Auth Controller
 * 
 * Handles user authentication, session initialization, logout and current user verification.
 */

class AuthController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * POST /api/auth/login
     */
    public function login(): void {
        $body = getRequestBody();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            jsonError('Email y contraseña son obligatorios.', 422);
        }

        $stmt = $this->pdo->prepare('SELECT id, email, password_hash, display_name, role, created_at FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => strtolower($email)]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Credenciales inválidas. Por favor revise su email y contraseña.', 401);
        }

        // Prevent session fixation attack
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];

        unset($user['password_hash']);

        jsonSuccess([
            'user' => $user
        ], 'Inicio de sesión exitoso.');
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): void {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        jsonSuccess(null, 'Sesión cerrada correctamente.');
    }

    /**
     * GET /api/auth/me
     */
    public function me(): void {
        $user = requireAuth($this->pdo);
        jsonSuccess([
            'user' => $user
        ]);
    }
}
