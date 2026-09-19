<?php
/**
 * iWE Dashboard API - Site Content Controller
 * 
 * Manages institutional key/value site text snippets with multi-language support (ES, CA, EN, FR).
 */

declare(strict_types=1);

class ContentController {
    private PDO $pdo;
    private array $config;

    public const SUPPORTED_LOCALES = ['es', 'ca', 'en', 'fr'];
    public const NON_TRANSLATABLE_KEYS = [
        'logo_url',
        'logo_height',
        'contact_phone',
        'contact_email',
        'contact_address',
        'business_name',
        'social_links_json',
        'social_instagram',
        'social_facebook',
        'social_youtube',
        'social_tiktok',
        'social_tripadvisor',
        'social_strava',
    ];

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/content
     * Query param: ?locale=es|ca|en|fr
     * Returns key-value dictionary and full translations map for dashboard.
     */
    public function list(): void {
        $locale = strtolower(trim((string)($_GET['locale'] ?? 'es')));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = 'es';
        }

        $stmt = $this->pdo->query('SELECT content_key, content_value, updated_at FROM site_content ORDER BY content_key ASC');
        $rows = $stmt->fetchAll();

        $baseMap = [];
        foreach ($rows as $row) {
            $baseMap[$row['content_key']] = $row['content_value'];
        }

        // Fetch translations for all locales (CA, EN, FR)
        $translations = [
            'ca' => [],
            'en' => [],
            'fr' => [],
        ];

        $stmtT = $this->pdo->query('SELECT content_key, locale, content_value FROM site_content_translations');
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc][$t['content_key']] = $t['content_value'];
            }
        }

        // Merge localized dictionary with fallback to Spanish
        $localizedMap = $baseMap;
        if ($locale !== 'es' && isset($translations[$locale])) {
            foreach ($translations[$locale] as $k => $val) {
                if (!empty(trim((string)$val)) && !in_array($k, self::NON_TRANSLATABLE_KEYS, true)) {
                    $localizedMap[$k] = $val;
                }
            }
        }

        jsonSuccess([
            'content'      => $localizedMap,
            'base'         => $baseMap,
            'translations' => $translations,
            'locale'       => $locale,
            'raw'          => $rows,
        ]);
    }

    /**
     * PUT /api/content/:key
     * Update an institutional text (requires authentication)
     */
    public function update(string $key): void {
        requireAuth($this->pdo);

        $key = trim($key);
        if (empty($key) || strlen($key) > 80) {
            jsonError('La clave de contenido no es válida (máximo 80 caracteres).', 422);
        }

        $body = getRequestBody();
        $value = $body['content_value'] ?? $body['value'] ?? null;
        $locale = strtolower(trim((string)($body['locale'] ?? 'es')));
        $translations = $body['translations'] ?? null;

        if ($value === null && !is_array($translations)) {
            jsonError('El valor de contenido (content_value) o traducciones es requerido.', 422);
        }

        $this->pdo->beginTransaction();
        try {
            // 1. If base value or ES locale provided:
            if ($value !== null && ($locale === 'es' || !in_array($locale, ['ca', 'en', 'fr'], true))) {
                $stmt = $this->pdo->prepare('
                    INSERT INTO site_content (content_key, content_value, updated_at)
                    VALUES (:key, :value, NOW())
                    ON DUPLICATE KEY UPDATE 
                        content_value = VALUES(content_value),
                        updated_at = NOW()
                ');
                $stmt->execute([
                    'key'   => $key,
                    'value' => (string)$value,
                ]);
            } elseif ($value !== null && in_array($locale, ['ca', 'en', 'fr'], true)) {
                // Update specific locale
                if (!in_array($key, self::NON_TRANSLATABLE_KEYS, true)) {
                    $valStr = trim((string)$value);
                    if ($valStr !== '') {
                        $stmtT = $this->pdo->prepare('
                            INSERT INTO site_content_translations (content_key, locale, content_value, updated_at)
                            VALUES (:key, :locale, :value, NOW())
                            ON DUPLICATE KEY UPDATE 
                                content_value = VALUES(content_value),
                                updated_at = NOW()
                        ');
                        $stmtT->execute([
                            'key'    => $key,
                            'locale' => $locale,
                            'value'  => $valStr,
                        ]);
                    } else {
                        $stmtDel = $this->pdo->prepare('DELETE FROM site_content_translations WHERE content_key = :key AND locale = :locale');
                        $stmtDel->execute(['key' => $key, 'locale' => $locale]);
                    }
                }
            }

            // 2. If bulk translations map provided:
            if (is_array($translations) && !in_array($key, self::NON_TRANSLATABLE_KEYS, true)) {
                foreach (['ca', 'en', 'fr'] as $loc) {
                    if (isset($translations[$loc])) {
                        $tVal = trim((string)$translations[$loc]);
                        if ($tVal !== '') {
                            $stmtT = $this->pdo->prepare('
                                INSERT INTO site_content_translations (content_key, locale, content_value, updated_at)
                                VALUES (:key, :locale, :value, NOW())
                                ON DUPLICATE KEY UPDATE 
                                    content_value = VALUES(content_value),
                                    updated_at = NOW()
                            ');
                            $stmtT->execute([
                                'key'    => $key,
                                'locale' => $loc,
                                'value'  => $tVal,
                            ]);
                        } else {
                            $stmtDel = $this->pdo->prepare('DELETE FROM site_content_translations WHERE content_key = :key AND locale = :locale');
                            $stmtDel->execute(['key' => $key, 'locale' => $loc]);
                        }
                    }
                }
            }

            $this->pdo->commit();

            jsonSuccess([
                'content_key'   => $key,
                'content_value' => (string)($value ?? ''),
                'locale'        => $locale,
                'updated_at'    => date('Y-m-d H:i:s'),
            ], 'Texto institucional actualizado correctamente.');

        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al actualizar texto: ' . $e->getMessage(), 500);
        }
    }
}
