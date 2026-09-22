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

    /**
     * POST /api/auth/forgot-password
     *
     * Always responds with the same generic success message regardless of
     * whether the email exists, so the endpoint cannot be used to enumerate
     * valid accounts (NAES §9.2).
     */
    public function forgotPassword(): void {
        $body = getRequestBody();
        $email = strtolower(trim($body['email'] ?? ''));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Ingresa un email válido.', 422);
        }

        $stmt = $this->pdo->prepare('SELECT id, email, display_name FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if ($user) {
            // Invalidate any previous unused tokens for this user before issuing a new one.
            $invalidate = $this->pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = :user_id AND used_at IS NULL');
            $invalidate->execute(['user_id' => $user['id']]);

            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $expiresAt = (new DateTime('+1 hour'))->format('Y-m-d H:i:s');

            $insert = $this->pdo->prepare(
                'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, :expires_at)'
            );
            $insert->execute([
                'user_id'    => $user['id'],
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
            ]);

            $resetUrl = rtrim($this->config['app']['site_url'] ?? '', '/') . '/panel-a3b5789b6538ee865ba75cec/reset-password?token=' . $rawToken;

            $subject = 'Recuperar contraseña — iWE Dashboard';
            $html = sprintf(
                '<p>Hola %s,</p><p>Recibimos una solicitud para restablecer tu contraseña del panel iWE.</p>'
                . '<p><a href="%s">Hacé clic aquí para elegir una nueva contraseña</a>. Este enlace vence en 1 hora.</p>'
                . '<p>Si no fuiste vos, podés ignorar este email.</p>',
                htmlspecialchars($user['display_name']),
                htmlspecialchars($resetUrl)
            );

            sendTransactionalEmail($this->config, $user['email'], $subject, $html);
        }

        jsonSuccess(null, 'Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.');
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(): void {
        $body = getRequestBody();
        $token = trim($body['token'] ?? '');
        $newPassword = $body['password'] ?? '';

        if (empty($token) || strlen($newPassword) < 8) {
            jsonError('Token inválido o contraseña demasiado corta (mínimo 8 caracteres).', 422);
        }

        $tokenHash = hash('sha256', $token);

        $stmt = $this->pdo->prepare(
            'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = :token_hash LIMIT 1'
        );
        $stmt->execute(['token_hash' => $tokenHash]);
        $resetToken = $stmt->fetch();

        if (!$resetToken || $resetToken['used_at'] !== null || strtotime($resetToken['expires_at']) < time()) {
            jsonError('El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.', 400);
        }

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        $this->pdo->beginTransaction();
        try {
            $update = $this->pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
            $update->execute(['hash' => $passwordHash, 'id' => $resetToken['user_id']]);

            $markUsed = $this->pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id');
            $markUsed->execute(['id' => $resetToken['id']]);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('No se pudo actualizar la contraseña. Intentá nuevamente.', 500);
        }

        jsonSuccess(null, 'Contraseña actualizada correctamente. Ya podés iniciar sesión.');
    }
}
