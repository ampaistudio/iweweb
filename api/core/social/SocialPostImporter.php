<?php
declare(strict_types=1);

final class SocialPostImporter {
    public function __construct(private PDO $pdo) {}

    public function import(string $platform, string $externalId, string $message, ?string $permalink, DateTimeImmutable $publishedAt): bool {
        if (!in_array($platform, ['facebook', 'instagram'], true) || $externalId === '' || strlen($externalId) > 120) {
            throw new InvalidArgumentException('Publicación social inválida.');
        }

        if ($this->alreadyImported($platform, $externalId)) {
            return false;
        }

        $authorId = (int)$this->pdo->query('SELECT id FROM users ORDER BY id ASC LIMIT 1')->fetchColumn();
        if ($authorId <= 0) {
            throw new RuntimeException('No hay un usuario para asignar la novedad importada.');
        }

        $message = trim($message) ?: "Nueva publicación en {$platform}";
        $title = mb_substr(trim(explode("\n", $message, 2)[0]), 0, 120);
        $slug = (slugify($title) ?: $platform) . '-' . substr(hash('sha256', $platform . ':' . $externalId), 0, 16);
        $body = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $date = $publishedAt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        if ($permalink !== null && (!str_starts_with($permalink, 'https://') || !filter_var($permalink, FILTER_VALIDATE_URL) || strlen($permalink) > 500)) {
            $permalink = null;
        }

        $this->pdo->beginTransaction();
        try {
            $post = $this->pdo->prepare("INSERT INTO posts (title, slug, body, status, origin, created_by, published_at)
                VALUES (?, ?, ?, 'published', ?, ?, ?)");
            $post->execute([$title, $slug, $body, $platform, $authorId, $date]);
            $link = $this->pdo->prepare("INSERT INTO post_social_links
                (post_id, platform, external_post_id, external_permalink, sync_status, synced_at)
                VALUES (?, ?, ?, ?, 'synced', CURRENT_TIMESTAMP)");
            $link->execute([(int)$this->pdo->lastInsertId(), $platform, $externalId, $permalink]);
            $this->pdo->commit();
            return true;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            // The database's unique key also protects concurrent imports.
            if ($e instanceof PDOException && $e->getCode() === '23000' && $this->alreadyImported($platform, $externalId)) {
                return false;
            }
            throw $e;
        }
    }

    private function alreadyImported(string $platform, string $externalId): bool {
        $query = $this->pdo->prepare('SELECT 1 FROM post_social_links WHERE platform = ? AND external_post_id = ? LIMIT 1');
        $query->execute([$platform, $externalId]);
        return (bool)$query->fetchColumn();
    }
}
