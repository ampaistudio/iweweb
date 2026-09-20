<?php
/**
 * iWE Dashboard API - Activity Translation Service
 * 
 * Manages saving and loading multi-language translations (CA, EN, FR)
 * for activities and highlights.
 */

declare(strict_types=1);

class ActivityTranslationService {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Load full translations dictionary for CA, EN, FR locales for a given activity
     */
    public function loadTranslations(string $activityId, array $baseHighlightsRows): array {
        $translations = [
            'ca' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
            'en' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
            'fr' => ['title' => '', 'description' => '', 'intro_title' => '', 'intro_text' => '', 'region' => '', 'country' => '', 'level' => '', 'duration' => '', 'alt_text' => '', 'highlights' => []],
        ];

        $stmtT = $this->pdo->prepare('SELECT locale, title, description, intro_title, intro_text, region, country, level, duration, alt_text FROM activity_translations WHERE activity_id = :id');
        $stmtT->execute(['id' => $activityId]);
        while ($t = $stmtT->fetch()) {
            $loc = $t['locale'];
            if (isset($translations[$loc])) {
                $translations[$loc]['title'] = $t['title'] ?? '';
                $translations[$loc]['description'] = $t['description'] ?? '';
                $translations[$loc]['intro_title'] = $t['intro_title'] ?? '';
                $translations[$loc]['intro_text'] = $t['intro_text'] ?? '';
                $translations[$loc]['region'] = $t['region'] ?? '';
                $translations[$loc]['country'] = $t['country'] ?? '';
                $translations[$loc]['level'] = $t['level'] ?? '';
                $translations[$loc]['duration'] = $t['duration'] ?? '';
                $translations[$loc]['alt_text'] = $t['alt_text'] ?? '';
            }
        }

        if (!empty($baseHighlightsRows)) {
            $highlightIds = array_column($baseHighlightsRows, 'id');
            $placeholders = implode(',', array_fill(0, count($highlightIds), '?'));
            $stmtHT = $this->pdo->prepare("
                SELECT highlight_id, locale, highlight_text 
                FROM activity_highlight_translations 
                WHERE highlight_id IN ({$placeholders})
            ");
            $stmtHT->execute($highlightIds);

            $idToIndex = [];
            foreach ($baseHighlightsRows as $idx => $r) {
                $idToIndex[$r['id']] = $idx;
            }

            foreach (['ca', 'en', 'fr'] as $loc) {
                $translations[$loc]['highlights'] = array_fill(0, count($baseHighlightsRows), '');
            }

            while ($ht = $stmtHT->fetch()) {
                $loc = $ht['locale'];
                $hId = $ht['highlight_id'];
                if (isset($translations[$loc], $idToIndex[$hId])) {
                    $translations[$loc]['highlights'][$idToIndex[$hId]] = $ht['highlight_text'];
                }
            }
        }

        return $translations;
    }

    /**
     * Compute display values for a specific non-ES locale, falling back to base ES fields
     */
    public function getDisplayValues(array $activity, array $baseHighlights, string $locale, array $translations): array {
        $display = [
            'title'       => $activity['title'],
            'description' => $activity['description'],
            'intro_title' => $activity['intro_title'] ?? null,
            'intro_text'  => $activity['intro_text'] ?? null,
            'region'      => $activity['region'],
            'country'     => $activity['country'],
            'level'       => $activity['level'],
            'duration'    => $activity['duration'],
            'alt_text'    => $activity['alt_text'],
            'highlights'  => $baseHighlights,
        ];

        if ($locale !== 'es' && isset($translations[$locale])) {
            $t = $translations[$locale];
            if (!empty($t['title']))       $display['title'] = $t['title'];
            if (!empty($t['description'])) $display['description'] = $t['description'];
            if (!empty($t['intro_title'])) $display['intro_title'] = $t['intro_title'];
            if (!empty($t['intro_text']))  $display['intro_text'] = $t['intro_text'];
            if (!empty($t['region']))      $display['region'] = $t['region'];
            if (!empty($t['country']))     $display['country'] = $t['country'];
            if (!empty($t['level']))       $display['level'] = $t['level'];
            if (!empty($t['duration']))    $display['duration'] = $t['duration'];
            if (!empty($t['alt_text']))    $display['alt_text'] = $t['alt_text'];

            if (!empty($t['highlights'])) {
                $display['highlights'] = array_map(function ($idx, $baseH) use ($t) {
                    $translated = $t['highlights'][$idx] ?? '';
                    return !empty($translated) ? $translated : $baseH;
                }, array_keys($baseHighlights), $baseHighlights);
            }
        }

        return $display;
    }

    /**
     * Save translations into activity_translations and activity_highlight_translations
     */
    public function saveTranslations(string $activityId, array $highlightIds, array $translations): void {
        foreach (['ca', 'en', 'fr'] as $loc) {
            if (!isset($translations[$loc]) || !is_array($translations[$loc])) {
                continue;
            }

            $tTitle = trim((string)($translations[$loc]['title'] ?? ''));
            $tDesc = sanitizeRichText((string)($translations[$loc]['description'] ?? ''));
            $tIntroTitle = trim((string)($translations[$loc]['intro_title'] ?? ''));
            $tIntroText = sanitizeRichText((string)($translations[$loc]['intro_text'] ?? ''));
            $tRegion = trim((string)($translations[$loc]['region'] ?? ''));
            $tCountry = trim((string)($translations[$loc]['country'] ?? ''));
            $tLevel = trim((string)($translations[$loc]['level'] ?? ''));
            $tDuration = trim((string)($translations[$loc]['duration'] ?? ''));
            $tAltText = trim((string)($translations[$loc]['alt_text'] ?? ''));

            if ($tTitle !== '' || $tDesc !== '' || $tIntroTitle !== '' || $tIntroText !== '' || $tRegion !== '' || $tCountry !== '' || $tLevel !== '' || $tDuration !== '' || $tAltText !== '') {
                $stmt = $this->pdo->prepare('
                    INSERT INTO activity_translations (activity_id, locale, title, description, intro_title, intro_text, region, country, level, duration, alt_text, created_at, updated_at)
                    VALUES (:activity_id, :locale, :title, :description, :intro_title, :intro_text, :region, :country, :level, :duration, :alt_text, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        description = VALUES(description),
                        intro_title = VALUES(intro_title),
                        intro_text = VALUES(intro_text),
                        region = VALUES(region),
                        country = VALUES(country),
                        level = VALUES(level),
                        duration = VALUES(duration),
                        alt_text = VALUES(alt_text),
                        updated_at = NOW()
                ');
                $stmt->execute([
                    'activity_id' => $activityId,
                    'locale'      => $loc,
                    'title'       => $tTitle,
                    'description' => $tDesc,
                    'intro_title' => $tIntroTitle !== '' ? $tIntroTitle : null,
                    'intro_text'  => $tIntroText !== '' ? $tIntroText : null,
                    'region'      => $tRegion !== '' ? $tRegion : null,
                    'country'     => $tCountry !== '' ? $tCountry : null,
                    'level'       => $tLevel !== '' ? $tLevel : null,
                    'duration'    => $tDuration !== '' ? $tDuration : null,
                    'alt_text'    => $tAltText !== '' ? $tAltText : null,
                ]);
            } else {
                $stmt = $this->pdo->prepare('DELETE FROM activity_translations WHERE activity_id = :activity_id AND locale = :locale');
                $stmt->execute(['activity_id' => $activityId, 'locale' => $loc]);
            }

            // Save highlight translations
            $tHighlights = $translations[$loc]['highlights'] ?? [];
            if (is_array($tHighlights)) {
                foreach ($highlightIds as $index => $hId) {
                    $tText = trim((string)($tHighlights[$index] ?? ''));
                    if ($tText !== '') {
                        $stmtHT = $this->pdo->prepare('
                            INSERT INTO activity_highlight_translations (highlight_id, locale, highlight_text, created_at, updated_at)
                            VALUES (:highlight_id, :locale, :highlight_text, NOW(), NOW())
                            ON DUPLICATE KEY UPDATE 
                                highlight_text = VALUES(highlight_text), 
                                updated_at = NOW()
                        ');
                        $stmtHT->execute([
                            'highlight_id'   => $hId,
                            'locale'         => $loc,
                            'highlight_text' => $tText,
                        ]);
                    } else {
                        $stmtHT = $this->pdo->prepare('DELETE FROM activity_highlight_translations WHERE highlight_id = :highlight_id AND locale = :locale');
                        $stmtHT->execute(['highlight_id' => $hId, 'locale' => $loc]);
                    }
                }
            }
        }
    }
}
