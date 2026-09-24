<?php
/** Package menu placement, detail content, media and API formatting. */
declare(strict_types=1);

class PackagePresentationService {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function enrichResponse(string $id, string $locale, bool $dashboard, array $res, array $translations): array {
        $contentStmt = $this->pdo->prepare('SELECT intro_title, intro_text, highlights_json, itinerary_json FROM package_content WHERE package_id = :id');
        $contentStmt->execute(['id' => $id]);
        $content = $contentStmt->fetch() ?: [];
        $contentTranslations = [
            'ca' => [], 'en' => [], 'fr' => [],
        ];
        $contentTransStmt = $this->pdo->prepare('SELECT locale, intro_title, intro_text, highlights_json, itinerary_json FROM package_content_translations WHERE package_id = :id');
        $contentTransStmt->execute(['id' => $id]);
        while ($translated = $contentTransStmt->fetch()) {
            if (isset($contentTranslations[$translated['locale']])) {
                $contentTranslations[$translated['locale']] = $translated;
            }
        }

        $detail = $content;
        if (!$dashboard && $locale !== 'es') {
            foreach (['intro_title', 'intro_text', 'highlights_json', 'itinerary_json'] as $field) {
                if (!empty($contentTranslations[$locale][$field])) {
                    $detail[$field] = $contentTranslations[$locale][$field];
                }
            }
        }
        $res['intro_title'] = $detail['intro_title'] ?? null;
        $res['intro_text'] = $detail['intro_text'] ?? null;
        $res['highlights'] = $this->decodeTextList($detail['highlights_json'] ?? null);
        $res['itinerary'] = $this->decodeTextList($detail['itinerary_json'] ?? null);
        $mediaStmt = $this->pdo->prepare('SELECT id, media_type, media_url, poster_url, alt_text, display_order FROM package_media WHERE package_id = :id ORDER BY display_order, id');
        $mediaStmt->execute(['id' => $id]);
        $res['media'] = $mediaStmt->fetchAll();
        if ($dashboard) {
            foreach ($contentTranslations as $loc => $fields) {
                $translations[$loc]['intro_title'] = $fields['intro_title'] ?? '';
                $translations[$loc]['intro_text'] = $fields['intro_text'] ?? '';
                $translations[$loc]['highlights'] = $this->decodeTextList($fields['highlights_json'] ?? null);
                $translations[$loc]['itinerary'] = $this->decodeTextList($fields['itinerary_json'] ?? null);
            }
            $res['translations'] = $translations;
        }

        return $res;
    }

    public function formatResponse(array $row): array {
        return [
            'id'                   => $row['id'],
            'title'                => $row['title'],
            'duration'             => $row['duration'],
            'description'          => $row['description'],
            'image_url'            => $row['image_url'] ?? null,
            'alt_text'             => $row['alt_text'] ?? null,
            'price_amount'         => $row['price_amount'] !== null ? (float)$row['price_amount'] : null,
            'price_currency'       => $row['price_currency'] ?? 'EUR',
            'price_unit'           => $row['price_unit'] ?? null,
            'display_order'        => (int)$row['display_order'],
            'published'            => (bool)$row['published'],
            'publish_at'           => $row['publish_at'] ?? null,
            'unpublish_at'         => $row['unpublish_at'] ?? null,
            'menu_parent_id'       => isset($row['menu_parent_id']) ? (int)$row['menu_parent_id'] : null,
            'menu_item_published'  => isset($row['menu_item_published']) ? (bool)$row['menu_item_published'] : false,
            'group_label'          => $row['group_label'] ?? null,
            'group_published'      => isset($row['group_published']) ? (bool)$row['group_published'] : false,
            'is_currently_visible' => isset($row['is_currently_visible']) ? (bool)$row['is_currently_visible'] : true,
            'created_at'           => $row['created_at'],
            'updated_at'           => $row['updated_at'],
        ];
    }

    private function decodeTextList(?string $json): array {
        $items = json_decode($json ?: '[]', true);
        return is_array($items) ? array_values(array_filter($items, 'is_string')) : [];
    }

    private function cleanTextList($items): array {
        if (!is_array($items)) return [];
        return array_values(array_filter(array_map(
            static fn($item) => is_string($item) ? trim($item) : '',
            $items
        )));
    }

    public function save(string $id, array $data, ?string $oldTitle): void {
        $menuStmt = $this->pdo->prepare('SELECT id, label FROM menu_items WHERE link_type = "package" AND target_value = :id ORDER BY id LIMIT 1');
        $menuStmt->execute(['id' => $id]);
        $menuItem = $menuStmt->fetch();

        if (array_key_exists('menu_parent_id', $data)) {
            $parentId = $data['menu_parent_id'] !== null && $data['menu_parent_id'] !== ''
                ? (int)$data['menu_parent_id'] : null;
            if ($parentId === null && $menuItem) {
                $remove = $this->pdo->prepare('DELETE FROM menu_items WHERE id = :id');
                $remove->execute(['id' => $menuItem['id']]);
                $menuItem = false;
            } elseif ($parentId !== null) {
                $label = trim((string)$data['title']);
                if ($menuItem) {
                    $keepCustomLabel = $oldTitle !== null && $menuItem['label'] !== $oldTitle;
                    $update = $this->pdo->prepare('
                        UPDATE menu_items SET parent_id = :parent_id, label = :label,
                            published = :published, publish_at = :publish_at, unpublish_at = :unpublish_at
                        WHERE id = :id
                    ');
                    $update->execute([
                        'parent_id' => $parentId,
                        'label' => $keepCustomLabel ? $menuItem['label'] : $label,
                        'published' => !empty($data['published']) ? 1 : 0,
                        'publish_at' => $data['publish_at'] ?? null,
                        'unpublish_at' => $data['unpublish_at'] ?? null,
                        'id' => $menuItem['id'],
                    ]);
                } else {
                    $insert = $this->pdo->prepare('
                        INSERT INTO menu_items (parent_id, label, link_type, target_value, display_order, published, publish_at, unpublish_at)
                        VALUES (:parent_id, :label, "package", :target_value, 0, :published, :publish_at, :unpublish_at)
                    ');
                    $insert->execute([
                        'parent_id' => $parentId,
                        'label' => $label,
                        'target_value' => $id,
                        'published' => !empty($data['published']) ? 1 : 0,
                        'publish_at' => $data['publish_at'] ?? null,
                        'unpublish_at' => $data['unpublish_at'] ?? null,
                    ]);
                    $menuId = (int)$this->pdo->lastInsertId();
                    $translatedLabels = $data['translations'] ?? [];
                    foreach (['ca', 'en', 'fr'] as $locale) {
                        $translatedTitle = trim((string)($translatedLabels[$locale]['title'] ?? ''));
                        if ($translatedTitle === '') continue;
                        $translationStmt = $this->pdo->prepare('INSERT INTO menu_item_translations (menu_item_id, locale, label) VALUES (:id, :locale, :label)');
                        $translationStmt->execute(['id' => $menuId, 'locale' => $locale, 'label' => $translatedTitle]);
                    }
                }
            }
        } elseif ($menuItem) {
            $sync = $this->pdo->prepare('UPDATE menu_items SET published = :published, publish_at = :publish_at, unpublish_at = :unpublish_at WHERE id = :id');
            $sync->execute([
                'published' => !empty($data['published']) ? 1 : 0,
                'publish_at' => $data['publish_at'] ?? null,
                'unpublish_at' => $data['unpublish_at'] ?? null,
                'id' => $menuItem['id'],
            ]);
        }

        if (array_key_exists('intro_title', $data) || array_key_exists('intro_text', $data)
            || array_key_exists('highlights', $data) || array_key_exists('itinerary', $data)) {
            $stmt = $this->pdo->prepare('
                INSERT INTO package_content (package_id, intro_title, intro_text, highlights_json, itinerary_json)
                VALUES (:id, :intro_title, :intro_text, :highlights, :itinerary)
                ON DUPLICATE KEY UPDATE intro_title = VALUES(intro_title), intro_text = VALUES(intro_text),
                    highlights_json = VALUES(highlights_json), itinerary_json = VALUES(itinerary_json)
            ');
            $stmt->execute([
                'id' => $id,
                'intro_title' => trim((string)($data['intro_title'] ?? '')) ?: null,
                'intro_text' => trim((string)($data['intro_text'] ?? '')) ?: null,
                'highlights' => json_encode($this->cleanTextList($data['highlights'] ?? []), JSON_UNESCAPED_UNICODE),
                'itinerary' => json_encode($this->cleanTextList($data['itinerary'] ?? []), JSON_UNESCAPED_UNICODE),
            ]);
        }

        if (isset($data['translations']) && is_array($data['translations'])) {
            foreach (['ca', 'en', 'fr'] as $locale) {
                $translated = $data['translations'][$locale] ?? [];
                $introTitle = trim((string)($translated['intro_title'] ?? ''));
                $introText = trim((string)($translated['intro_text'] ?? ''));
                $highlights = $this->cleanTextList($translated['highlights'] ?? []);
                $itinerary = $this->cleanTextList($translated['itinerary'] ?? []);
                if ($introTitle === '' && $introText === '' && !$highlights && !$itinerary) {
                    $delete = $this->pdo->prepare('DELETE FROM package_content_translations WHERE package_id = :id AND locale = :locale');
                    $delete->execute(['id' => $id, 'locale' => $locale]);
                    continue;
                }
                $upsert = $this->pdo->prepare('
                    INSERT INTO package_content_translations
                        (package_id, locale, intro_title, intro_text, highlights_json, itinerary_json)
                    VALUES (:id, :locale, :intro_title, :intro_text, :highlights, :itinerary)
                    ON DUPLICATE KEY UPDATE intro_title = VALUES(intro_title), intro_text = VALUES(intro_text),
                        highlights_json = VALUES(highlights_json), itinerary_json = VALUES(itinerary_json)
                ');
                $upsert->execute([
                    'id' => $id,
                    'locale' => $locale,
                    'intro_title' => $introTitle ?: null,
                    'intro_text' => $introText ?: null,
                    'highlights' => json_encode($highlights, JSON_UNESCAPED_UNICODE),
                    'itinerary' => json_encode($itinerary, JSON_UNESCAPED_UNICODE),
                ]);
            }
        }

        if (isset($data['media']) && is_array($data['media'])) {
            $delete = $this->pdo->prepare('DELETE FROM package_media WHERE package_id = :id');
            $delete->execute(['id' => $id]);
            $insert = $this->pdo->prepare('
                INSERT INTO package_media (package_id, media_type, media_url, poster_url, alt_text, display_order)
                VALUES (:id, :media_type, :media_url, :poster_url, :alt_text, :display_order)
            ');
            foreach ($data['media'] as $order => $media) {
                if (!is_array($media) || empty($media['media_url'])) continue;
                $insert->execute([
                    'id' => $id,
                    'media_type' => ($media['media_type'] ?? 'image') === 'video' ? 'video' : 'image',
                    'media_url' => trim((string)$media['media_url']),
                    'poster_url' => !empty($media['poster_url']) ? trim((string)$media['poster_url']) : null,
                    'alt_text' => !empty($media['alt_text']) ? trim((string)$media['alt_text']) : null,
                    'display_order' => $order,
                ]);
            }
        }
    }

}
