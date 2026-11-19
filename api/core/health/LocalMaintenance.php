<?php
declare(strict_types=1);

final class LocalMaintenance {
    public static function directory(): string {
        $root = dirname(__DIR__, 3);
        $config = require $root . '/api/config/config.php';
        $configured = (string)($config['storage']['backups_dir'] ?? '');
        $private = str_starts_with($configured, '/') ? realpath($configured) : false;
        if (!$private || $private === $root || str_starts_with($private, $root . DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('Se requiere un directorio privado de respaldos fuera del sitio.');
        }
        $path = $private . '/maintenance-' . substr(hash('sha256', $root), 0, 20);
        if (!is_dir($path) && !@mkdir($path, 0700) && !is_dir($path)) {
            throw new RuntimeException('No se pudo crear el directorio de mantenimiento.');
        }
        if (is_link($path) || (fileperms($path) & 0077) !== 0 ||
            (function_exists('posix_geteuid') && fileowner($path) !== posix_geteuid())) {
            throw new RuntimeException('Directorio de mantenimiento inseguro.');
        }
        return $path;
    }

    public static function handle(string $method): void {
        if (PHP_SAPI !== 'cli-server' || !in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'], true)) {
            jsonError('El ejecutor está disponible únicamente en el entorno local.', 503);
        }
        header('Cache-Control: no-store');
        $file = self::directory() . '/state.sqlite';
        if (!is_file($file)) jsonError('El ejecutor local está desconectado.', 503);
        $db = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $db->exec('PRAGMA busy_timeout=5000');
        if ($method === 'POST') {
            if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
                jsonError('Se requiere una solicitud JSON.', 415);
            }
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload) || count($payload) !== 1) jsonError('Acción inválida.', 400);
            if (($payload['start'] ?? null) === true) {
                $query = $db->prepare('UPDATE control SET requested=1 WHERE heartbeat>=? AND running=0 AND requested=0');
            } elseif (is_bool($payload['automatic'] ?? null)) {
                $query = $db->prepare('UPDATE control SET automatic=' . (int)$payload['automatic'] . ' WHERE heartbeat>=?');
            } else {
                jsonError('Acción inválida.', 400);
            }
            $query->execute([time()-90]);
            if (!$query->rowCount()) jsonError('Ejecutor ocupado o desconectado.', 409);
        }
        $row = $db->query('SELECT automatic,requested,running,heartbeat,message FROM control WHERE id=1')->fetch(PDO::FETCH_ASSOC);
        jsonSuccess(['automatic'=>(bool)$row['automatic'], 'busy'=>(bool)($row['running'] || $row['requested']),
            'online'=>(int)$row['heartbeat'] >= time()-90, 'message'=>$row['message']]);
    }
}
