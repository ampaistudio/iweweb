<?php
/** Shared per-host throttle for authentication endpoints. */
declare(strict_types=1);

class AuthRateLimiter {
    private string $directory;

    public function __construct(?string $directory = null) {
        $this->directory = $directory ?: (getenv('IWE_AUTH_RATE_DIR') ?: sys_get_temp_dir() . '/iwe-auth-rate-' . substr(hash('sha256', __DIR__), 0, 12));
        if (!is_dir($this->directory) && !@mkdir($this->directory, 0700, true)) {
            throw new RuntimeException('No se pudo preparar el límite de acceso.');
        }
        $resolved = realpath($this->directory);
        $documentRoot = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
        if ($resolved === false || !is_writable($resolved)
            || ($documentRoot !== false && ($resolved === $documentRoot || str_starts_with($resolved, $documentRoot . DIRECTORY_SEPARATOR)))) {
            throw new RuntimeException('El límite de acceso requiere almacenamiento privado.');
        }
        $this->directory = $resolved;
    }

    public function consume(string $scope, string $identity, int $limit, int $windowSeconds): bool {
        $key = hash('sha256', $scope . "\0" . $identity);
        $path = $this->directory . '/' . $key . '.json';
        $handle = @fopen($path, 'c+');
        if ($handle === false) throw new RuntimeException('No se pudo comprobar el límite de acceso.');
        @chmod($path, 0600);
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('No se pudo bloquear el límite de acceso.');
            $saved = json_decode((string)stream_get_contents($handle), true);
            $now = time();
            $started = is_array($saved) ? (int)($saved['started'] ?? 0) : 0;
            $count = is_array($saved) ? (int)($saved['count'] ?? 0) : 0;
            if ($started <= 0 || $now - $started >= $windowSeconds) {
                $started = $now;
                $count = 0;
            }
            $count++;
            rewind($handle);
            if (!ftruncate($handle, 0) || fwrite($handle, json_encode(['started' => $started, 'count' => $count])) === false
                || !fflush($handle)) {
                throw new RuntimeException('No se pudo guardar el límite de acceso.');
            }
            return $count <= $limit;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
