<?php
/**
 * iWE Dashboard API - Reviews Controller
 * 
 * Manages Google Reviews and TripAdvisor Reviews integrations.
 * Google Places API and TripAdvisor Content API are the sole source of reviews.
 * No mock reviews or hardcoded identifiers are retained (NAES §8.2).
 */

declare(strict_types=1);

class ReviewsController
{
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config)
    {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * GET /api/reviews/google
     */
    public function getGoogleReviews(): void
    {
        $googleConfig = $this->config['google_places'] ?? [];
        $apiKey = $googleConfig['api_key'] ?? '';
        $placeId = $googleConfig['place_id'] ?? '';
        $cid = $googleConfig['cid'] ?? '';

        // If real credentials are provided, attempt live Places API call
        if (!empty($apiKey) && !empty($placeId)) {
            try {
                $url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=" . urlencode($placeId) . "&fields=name,rating,reviews,user_ratings_total&language=es&key=" . urlencode($apiKey);
                $ctx = stream_context_create(['http' => ['timeout' => 4]]);
                $resp = @file_get_contents($url, false, $ctx);
                if ($resp !== false) {
                    $json = json_decode($resp, true);
                    if (isset($json['result'])) {
                        jsonSuccess([
                            'source'             => 'google',
                            'is_configured'      => true,
                            'rating'             => $json['result']['rating'] ?? 0,
                            'user_ratings_total' => $json['result']['user_ratings_total'] ?? 0,
                            'place_id'           => $placeId,
                            'cid'                => $cid,
                            'reviews'            => $json['result']['reviews'] ?? [],
                        ], 'Google reviews recuperadas correctamente.');
                        return;
                    }
                }
            } catch (Throwable $e) {
                error_log('Google Places API call failed: ' . $e->getMessage());
            }
        }

        jsonSuccess([
            'source'             => 'google',
            'is_configured'      => !empty($apiKey) && !empty($placeId),
            'rating'             => 0,
            'user_ratings_total' => 0,
            'place_id'           => $placeId,
            'cid'                => $cid,
            'reviews'            => [],
        ], 'Google Places reviews no configuradas o sin reseñas.');
    }

    /**
     * GET /api/reviews/tripadvisor
     */
    public function getTripAdvisorReviews(): void
    {
        $taConfig = $this->config['tripadvisor'] ?? [];
        $apiKey = $taConfig['api_key'] ?? '';
        $locationId = $taConfig['location_id'] ?? '';

        // If real credentials are provided, attempt live TripAdvisor Content API call
        if (!empty($apiKey) && !empty($locationId)) {
            try {
                $url = "https://api.content.tripadvisor.com/api/v1/location/{$locationId}/reviews?key=" . urlencode($apiKey) . "&language=es";
                $ctx = stream_context_create([
                    'http' => [
                        'timeout' => 4,
                        'header'  => "Accept: application/json\r\n",
                    ]
                ]);
                $resp = @file_get_contents($url, false, $ctx);
                if ($resp !== false) {
                    $json = json_decode($resp, true);
                    if (isset($json['data'])) {
                        jsonSuccess([
                            'source'        => 'tripadvisor',
                            'is_configured' => true,
                            'rating'        => 0,
                            'location_id'   => $locationId,
                            'reviews'       => $json['data'] ?? [],
                        ], 'TripAdvisor reviews recuperadas correctamente.');
                        return;
                    }
                }
            } catch (Throwable $e) {
                error_log('TripAdvisor Content API call failed: ' . $e->getMessage());
            }
        }

        jsonSuccess([
            'source'        => 'tripadvisor',
            'is_configured' => !empty($apiKey) && !empty($locationId),
            'rating'        => 0,
            'num_reviews'   => 0,
            'location_id'   => $locationId,
            'reviews'       => [],
        ], 'TripAdvisor reviews no configuradas o sin reseñas.');
    }
}
