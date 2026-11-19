<?php
declare(strict_types=1);

/** Fixed-size, per-provider cache and refresh budget shared by PHP workers. */
class ReviewsCache {
    public function fetch(string $provider, string $url, $context): ?array {
        if (!in_array($provider, ['google', 'tripadvisor'], true)) throw new InvalidArgumentException('Proveedor inválido.');
        $dir = getenv('IWE_REVIEWS_CACHE_DIR') ?: sys_get_temp_dir() . '/iwe-reviews-' . substr(hash('sha256', __DIR__), 0, 12);
        if (!is_dir($dir) && !@mkdir($dir, 0700, true)) throw new RuntimeException('Cache no disponible.');
        $dir = realpath($dir);
        $root = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
        if ($dir === false || ($root !== false && ($dir === $root || str_starts_with($dir, $root . DIRECTORY_SEPARATOR)))) {
            throw new RuntimeException('Cache requiere almacenamiento privado.');
        }
        $path = $dir . '/' . $provider . '.json';
        $handle = @fopen($path, 'c+');
        if ($handle === false) throw new RuntimeException('Cache no disponible.');
        @chmod($path, 0600);
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('Cache no disponible.');
            $saved = json_decode((string)stream_get_contents($handle), true) ?: [];
            $now = time();
            $fingerprint = hash('sha256', $url);
            $same = ($saved['fingerprint'] ?? '') === $fingerprint;
            $data = $same && ($saved['updated'] ?? 0) > $now - 86400 ? ($saved['data'] ?? null) : null;
            if (($saved['next_attempt'] ?? 0) > $now) return $data;
            // Persist the budget BEFORE network I/O, including failures or worker termination.
            $state = ['fingerprint' => $fingerprint, 'updated' => $same ? ($saved['updated'] ?? 0) : 0,
                'data' => $data, 'next_attempt' => $now + 300];
            $this->write($handle, $state);
            $body = @file_get_contents($url, false, $context, 0, 1048577);
            $decoded = is_string($body) && strlen($body) <= 1048576 ? json_decode($body, true) : null;
            $field = $provider === 'google' ? 'result' : 'data';
            if (is_array($decoded) && isset($decoded[$field]) && is_array($decoded[$field])) {
                $state['data'] = $decoded;
                $state['updated'] = $now;
                $state['next_attempt'] = $now + 3600;
                $this->write($handle, $state);
                return $decoded;
            }
            return $data;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function write($handle, array $state): void {
        $json = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $json) !== strlen($json) || !fflush($handle)) {
            throw new RuntimeException('No se pudo guardar cache.');
        }
    }
}
