<?php
/**
 * iWE Dashboard API - Database Connection Manager (PDO)
 * 
 * Complies with NAES Pillar 4 (Security):
 * - Prepared statements strictly enforced (EMULATE_PREPARES = false)
 * - Exception mode active
 * - UTF-8 multi-byte encoding
 * - No plain-text credentials logged
 */

class Database {
    private static ?PDO $instance = null;

    /**
     * Get or initialize the PDO database connection instance.
     */
    public static function getConnection(?array $config = null): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if ($config === null) {
            $appConfig = require __DIR__ . '/config.php';
            $dbConfig = $appConfig['db'];
        } else {
            $dbConfig = $config;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $dbConfig['host'],
            $dbConfig['port'] ?? 3306,
            $dbConfig['database'],
            $dbConfig['charset'] ?? 'utf8mb4'
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            self::$instance = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);
            return self::$instance;
        } catch (PDOException $e) {
            // Never expose raw database credentials or internal host info
            error_log('Database connection error: ' . $e->getMessage());
            throw new RuntimeException('Error al conectar con la base de datos MySQL.', 500);
        }
    }

    /**
     * Helper to set a custom PDO instance (useful for unit testing / mocking).
     */
    public static function setInstance(?PDO $pdo): void {
        self::$instance = $pdo;
    }
}
