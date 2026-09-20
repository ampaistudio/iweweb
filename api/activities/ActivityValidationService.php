<?php
/**
 * iWE Dashboard API - Activity Validation & Formatting Helper
 * 
 * Provides server-side validation rules and response formatting for activities.
 */

declare(strict_types=1);

class ActivityValidationService {
    /**
     * Server-side validation of activity fields
     */
    public static function validate(array $data, array $allowedTypes): array {
        $errors = [];

        $required = ['title', 'region', 'country', 'type', 'level', 'duration', 'description'];
        foreach ($required as $field) {
            if (empty(trim((string)($data[$field] ?? '')))) {
                $errors[$field] = "El campo '{$field}' es obligatorio.";
            }
        }

        $image = $data['image'] ?? $data['image_url'] ?? '';
        if (empty(trim((string)$image))) {
            $errors['image'] = "La URL de imagen o archivo media es obligatoria.";
        }

        $alt = $data['alt'] ?? $data['alt_text'] ?? '';
        if (empty(trim((string)$alt))) {
            $errors['alt'] = "El texto alternativo (alt) es obligatorio para accesibilidad.";
        }

        $type = $data['type'] ?? '';
        if (!in_array($type, $allowedTypes, true)) {
            $allowedStr = implode(', ', $allowedTypes);
            $errors['type'] = "Tipo de actividad inválido '{$type}'. Valores permitidos: {$allowedStr}";
        }

        if (isset($data['highlights']) && !is_array($data['highlights'])) {
            $errors['highlights'] = "El campo 'highlights' debe ser una lista de strings.";
        }

        return $errors;
    }

    /**
     * Format database row to 1:1 match TypeScript Activity type
     */
    public static function formatResponse(array $row, array $highlights): array {
        return [
            'id'            => $row['id'],
            'title'         => $row['title'],
            'region'        => $row['region'],
            'country'       => $row['country'],
            'type'          => $row['type'],
            'level'         => $row['level'],
            'duration'      => $row['duration'],
            'image'         => $row['image_url'],
            'image_url'     => $row['image_url'],
            'alt'           => $row['alt_text'],
            'alt_text'      => $row['alt_text'],
            'price'         => $row['price'] ?: null,
            'description'   => $row['description'],
            'intro_title'   => $row['intro_title'] ?? null,
            'intro_text'    => $row['intro_text'] ?? null,
            'highlights'    => $highlights,
            'display_order' => (int)$row['display_order'],
            'published'     => (bool)$row['published'],
            'created_at'    => $row['created_at'],
            'updated_at'    => $row['updated_at'],
        ];
    }
}
