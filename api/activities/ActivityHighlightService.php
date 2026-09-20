<?php
/**
 * iWE Dashboard API - Activity Highlight Service
 * 
 * Handles fetching, saving, and reordering highlight bullet points for activities.
 */

declare(strict_types=1);

class ActivityHighlightService {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Fetch highlights map for a list of activity IDs
     */
    public function getHighlightsForActivities(array $activityIds, string $locale = 'es'): array {
        if (empty($activityIds)) {
            return [];
        }

        $highlightsByActivity = [];
        $placeholders = implode(',', array_fill(0, count($activityIds), '?'));

        if ($locale !== 'es') {
            $stmtH = $this->pdo->prepare("
                SELECT 
                    h.activity_id,
                    COALESCE(NULLIF(ht.highlight_text, ''), h.highlight_text) AS highlight_text,
                    h.display_order 
                FROM activity_highlights h
                LEFT JOIN activity_highlight_translations ht ON ht.highlight_id = h.id AND ht.locale = ?
                WHERE h.activity_id IN ({$placeholders})
                ORDER BY h.display_order ASC, h.id ASC
            ");
            $stmtH->execute(array_merge([$locale], $activityIds));
        } else {
            $stmtH = $this->pdo->prepare("
                SELECT activity_id, highlight_text, display_order 
                FROM activity_highlights 
                WHERE activity_id IN ({$placeholders})
                ORDER BY display_order ASC, id ASC
            ");
            $stmtH->execute($activityIds);
        }

        while ($h = $stmtH->fetch()) {
            $highlightsByActivity[$h['activity_id']][] = $h['highlight_text'];
        }

        return $highlightsByActivity;
    }

    /**
     * Fetch base highlights for a single activity
     */
    public function getBaseHighlights(string $activityId): array {
        $stmtH = $this->pdo->prepare('SELECT id, highlight_text, display_order FROM activity_highlights WHERE activity_id = :id ORDER BY display_order ASC, id ASC');
        $stmtH->execute(['id' => $activityId]);
        return $stmtH->fetchAll();
    }

    /**
     * Save base highlights for an activity and return inserted IDs
     */
    public function saveHighlights(string $activityId, array $highlights): array {
        $insertedIds = [];
        if (!is_array($highlights)) {
            return $insertedIds;
        }

        $stmtH = $this->pdo->prepare('
            INSERT INTO activity_highlights (activity_id, highlight_text, display_order)
            VALUES (:activity_id, :highlight_text, :display_order)
        ');
        foreach ($highlights as $order => $text) {
            $text = trim((string)$text);
            if ($text !== '') {
                $stmtH->execute([
                    'activity_id'    => $activityId,
                    'highlight_text' => $text,
                    'display_order'  => $order + 1,
                ]);
                $insertedIds[] = (int)$this->pdo->lastInsertId();
            }
        }

        return $insertedIds;
    }

    /**
     * Delete base highlights for an activity
     */
    public function deleteHighlights(string $activityId): void {
        $stmtDel = $this->pdo->prepare('DELETE FROM activity_highlights WHERE activity_id = :id');
        $stmtDel->execute(['id' => $activityId]);
    }
}
