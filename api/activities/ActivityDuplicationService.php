<?php
/**
 * iWE Dashboard API - Activity Duplication Service
 * 
 * Handles duplicating activities (content, highlights, translations, gallery)
 * into a new unpublished activity with a fresh unique ID.
 */

declare(strict_types=1);

class ActivityDuplicationService {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * POST /api/activities/:id/duplicate
     * Duplicates an activity and all its content (highlights, translations, gallery)
     * into a new activity with a fresh id.
     */
    public function duplicate(string $id): void {
        requireAuth($this->pdo);

        $stmt = $this->pdo->prepare('SELECT * FROM activities WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $source = $stmt->fetch();
        if (!$source) {
            jsonError('Actividad no encontrada.', 404);
        }

        $newId = $this->generateUniqueDuplicateId($source['id']);
        $newTitle = $source['title'] . ' (copia)';

        $this->pdo->beginTransaction();
        try {
            $stmtInsertAct = $this->pdo->prepare('
                INSERT INTO activities (
                    id, title, region, country, type, level, duration,
                    image_url, alt_text, price, description, intro_title, intro_text,
                    display_order, published, created_at, updated_at
                ) VALUES (
                    :id, :title, :region, :country, :type, :level, :duration,
                    :image_url, :alt_text, :price, :description, :intro_title, :intro_text,
                    :display_order, 0, NOW(), NOW()
                )
            ');
            $stmtInsertAct->execute([
                'id'            => $newId,
                'title'         => $newTitle,
                'region'        => $source['region'],
                'country'       => $source['country'],
                'type'          => $source['type'],
                'level'         => $source['level'],
                'duration'      => $source['duration'],
                'image_url'     => $source['image_url'],
                'alt_text'      => $source['alt_text'],
                'price'         => $source['price'],
                'description'   => $source['description'],
                'intro_title'   => $source['intro_title'] ?? null,
                'intro_text'    => $source['intro_text'] ?? null,
                'display_order' => (int)$source['display_order'],
            ]);

            // Copy highlights, keeping a map from old highlight id to new one
            $stmtSrcHighlights = $this->pdo->prepare('SELECT id, highlight_text, display_order FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
            $stmtSrcHighlights->execute(['id' => $id]);
            $sourceHighlights = $stmtSrcHighlights->fetchAll();

            $highlightIdMap = [];
            $stmtInsertHighlight = $this->pdo->prepare('
                INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
                VALUES (:activity_id, :highlight_text, :display_order)
            ');
            foreach ($sourceHighlights as $h) {
                $stmtInsertHighlight->execute([
                    'activity_id'    => $newId,
                    'highlight_text' => $h['highlight_text'],
                    'display_order'  => $h['display_order'],
                ]);
                $highlightIdMap[$h['id']] = (int)$this->pdo->lastInsertId();
            }

            // Copy translations (CA/EN/FR)
            $stmtSrcTrans = $this->pdo->prepare('SELECT * FROM activity_translations WHERE activity_id = :id');
            $stmtSrcTrans->execute(['id' => $id]);
            $stmtInsertTrans = $this->pdo->prepare('
                INSERT INTO activity_translations (activity_id, locale, title, description, intro_title, intro_text, created_at, updated_at)
                VALUES (:activity_id, :locale, :title, :description, :intro_title, :intro_text, NOW(), NOW())
            ');
            while ($t = $stmtSrcTrans->fetch()) {
                $stmtInsertTrans->execute([
                    'activity_id' => $newId,
                    'locale'      => $t['locale'],
                    'title'       => $t['title'] . ' (copia)',
                    'description' => $t['description'],
                    'intro_title' => $t['intro_title'] ?? null,
                    'intro_text'  => $t['intro_text'] ?? null,
                ]);
            }

            // Copy highlight translations
            if (!empty($highlightIdMap)) {
                $placeholders = implode(',', array_fill(0, count($highlightIdMap), '?'));
                $stmtSrcHT = $this->pdo->prepare("SELECT highlight_id, locale, highlight_text FROM activity_highlight_translations WHERE highlight_id IN ({$placeholders})");
                $stmtSrcHT->execute(array_keys($highlightIdMap));
                $stmtInsertHT = $this->pdo->prepare('
                    INSERT INTO activity_highlight_translations (highlight_id, locale, highlight_text, created_at, updated_at)
                    VALUES (:highlight_id, :locale, :highlight_text, NOW(), NOW())
                ');
                while ($ht = $stmtSrcHT->fetch()) {
                    $stmtInsertHT->execute([
                        'highlight_id'   => $highlightIdMap[$ht['highlight_id']],
                        'locale'         => $ht['locale'],
                        'highlight_text' => $ht['highlight_text'],
                    ]);
                }
            }

            // Copy gallery images (photos and videos)
            $stmtSrcImages = $this->pdo->prepare('SELECT * FROM activity_images WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
            $stmtSrcImages->execute(['id' => $id]);
            $stmtInsertImage = $this->pdo->prepare('
                INSERT INTO activity_images (activity_id, image_url, media_type, poster_url, alt_text, display_order, is_cover, created_at)
                VALUES (:activity_id, :image_url, :media_type, :poster_url, :alt_text, :display_order, :is_cover, NOW())
            ');
            while ($img = $stmtSrcImages->fetch()) {
                $stmtInsertImage->execute([
                    'activity_id'   => $newId,
                    'image_url'     => $img['image_url'],
                    'media_type'    => $img['media_type'] ?? 'image',
                    'poster_url'    => $img['poster_url'] ?? null,
                    'alt_text'      => $img['alt_text'],
                    'display_order' => (int)$img['display_order'],
                    'is_cover'      => (int)$img['is_cover'],
                ]);
            }

            $this->pdo->commit();

            jsonSuccess(['id' => $newId, 'title' => $newTitle], 'Actividad duplicada correctamente.', 201);
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            jsonError('Error al duplicar la actividad: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generates a unique activity id derived from the source id (e.g. "heliflight-copia")
     */
    private function generateUniqueDuplicateId(string $sourceId): string {
        $base = $sourceId . '-copia';
        $candidate = $base;
        $suffix = 2;

        $stmt = $this->pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        while (true) {
            $stmt->execute(['id' => $candidate]);
            if (!$stmt->fetch()) {
                return $candidate;
            }
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }
    }
}
