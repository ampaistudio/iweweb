<?php
/**
 * iWE Dashboard API - Newsletter Controller
 * 
 * Handles public newsletter subscriptions and subscriber management.
 */

declare(strict_types=1);

class NewsletterController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * POST /api/newsletter/subscribe
     * Public endpoint to subscribe an email to the newsletter.
     */
    public function subscribe(): void {
        $body = getRequestBody();
        $email = trim((string)($body['email'] ?? ''));

        if ($email === '') {
            jsonError('El correo electrónico es obligatorio.', 400);
        }

        // Server-side email format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('El formato del correo electrónico no es válido.', 400);
        }

        // Sanitize and lower-case email
        $normalizedEmail = strtolower(mb_substr($email, 0, 255));

        try {
            // Check if email already exists
            $stmt = $this->pdo->prepare('SELECT id, status FROM newsletter_subscribers WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $normalizedEmail]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // If unsubscribed, reactivate
                if ($existing['status'] === 'unsubscribed') {
                    $updateStmt = $this->pdo->prepare('UPDATE newsletter_subscribers SET status = "active", updated_at = NOW() WHERE id = :id');
                    $updateStmt->execute([':id' => $existing['id']]);
                }
                // Idempotent success response
                jsonSuccess([
                    'email'  => $normalizedEmail,
                    'status' => 'active',
                ], '¡Gracias por unirte! Tu correo ya forma parte de nuestra lista.');
                return;
            }

            // Insert new subscriber
            $insertStmt = $this->pdo->prepare('INSERT INTO newsletter_subscribers (email, status, subscribed_at) VALUES (:email, "active", NOW())');
            $insertStmt->execute([':email' => $normalizedEmail]);

            jsonSuccess([
                'email'  => $normalizedEmail,
                'status' => 'active',
            ], '¡Suscripción confirmada! Nos vemos en la montaña.', 200);

        } catch (PDOException $e) {
            error_log('Newsletter subscription DB error: ' . $e->getMessage());
            jsonError('No se pudo procesar la suscripción. Inténtalo de nuevo más tarde.', 500);
        }
    }

    /**
     * GET /api/newsletter/subscribers
     * Admin endpoint to list all subscribers.
     */
    public function list(): void {
        requireAdmin($this->pdo);

        try {
            $stmt = $this->pdo->query('SELECT id, email, status, subscribed_at, updated_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
            $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonSuccess($subscribers);
        } catch (PDOException $e) {
            error_log('Newsletter list DB error: ' . $e->getMessage());
            jsonError('Error al obtener la lista de suscriptores.', 500);
        }
    }
}

