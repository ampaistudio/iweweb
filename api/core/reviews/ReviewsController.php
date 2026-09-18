<?php
/**
 * iWE Dashboard API - Reviews Controller
 * 
 * Manages Google Reviews and TripAdvisor Reviews integrations.
 * When real API keys are absent, returns structured mock data adhering to
 * Google Places API (New/Legacy) and TripAdvisor Content API schemas.
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
     * 
     * Google Places API Integration:
     * - CID: 0x364c511f18f0fa2c ("Isard Wildland" in Google Maps Andorra)
     * - Once Christian obtains the Google Places API Key, set GOOGLE_PLACES_API_KEY and
     *   resolve the CID to Place ID (or set GOOGLE_PLACE_ID) in config.local.php.
     */
    public function getGoogleReviews(): void
    {
        $googleConfig = $this->config['google_places'] ?? [];
        $apiKey = $googleConfig['api_key'] ?? '';
        $placeId = $googleConfig['place_id'] ?? '';
        $cid = $googleConfig['cid'] ?? '0x364c511f18f0fa2c';

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
                            'is_mock'            => false,
                            'rating'             => $json['result']['rating'] ?? 4.9,
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
                // Fall through to mock response on failure
            }
        }

        // Mock response adhering strictly to Google Places API reviews format
        $mockData = [
            'source'             => 'google',
            'is_mock'            => true,
            'rating'             => 4.9,
            'user_ratings_total' => 52,
            'place_name'         => 'Isard Wildland Experience',
            'cid'                => $cid,
            'place_id'           => $placeId ?: 'PENDING_PLACE_ID_RESOLUTION',
            'reviews'            => [
                [
                    'author_name'               => 'Marc Vidal',
                    'author_url'                => 'https://maps.google.com',
                    'profile_photo_url'         => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    'rating'                    => 5,
                    'relative_time_description' => 'Hace 3 semanas',
                    'text'                      => 'Hicimos una ruta de e-bike con Charly en Arcalís y la experiencia fue simplemente inmejorable. Vistas espectaculares, material de primera y un trato súper cercano y profesional.',
                    'time'                      => time() - (86400 * 21),
                ],
                [
                    'author_name'               => 'Sophie Laurent',
                    'author_url'                => 'https://maps.google.com',
                    'profile_photo_url'         => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                    'rating'                    => 5,
                    'relative_time_description' => 'Hace 1 mes',
                    'text'                      => 'Journée inoubliable en 4x4 jusqu\'au Pic Negre et Tor ! Charly connaît chaque recoin des Pyrénées et partage l\'histoire de la région avec passion. À refaire absolument.',
                    'time'                      => time() - (86400 * 30),
                ],
                [
                    'author_name'               => 'Javier Gómez',
                    'author_url'                => 'https://maps.google.com',
                    'profile_photo_url'         => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
                    'rating'                    => 5,
                    'relative_time_description' => 'Hace 2 meses',
                    'text'                      => 'La vía ferrata con iWE fue la mejor actividad de nuestras vacaciones en Andorra. Éramos principiantes y la seguridad y paciencia de los guías nos dio total confianza.',
                    'time'                      => time() - (86400 * 60),
                ],
                [
                    'author_name'               => 'Elena R.',
                    'author_url'                => 'https://maps.google.com',
                    'profile_photo_url'         => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
                    'rating'                    => 5,
                    'relative_time_description' => 'Hace 3 meses',
                    'text'                      => 'Excursión de raquetas de nieve al atardecer perfecta. Paisajes vírgenes, buena conversación y atención impecable. 100% recomendados.',
                    'time'                      => time() - (86400 * 90),
                ],
            ],
        ];

        jsonSuccess($mockData, 'Mock data de Google Reviews generado (sin API key configurada).');
    }

    /**
     * GET /api/reviews/tripadvisor
     * 
     * TripAdvisor Content API Integration:
     * - Location ID: d18719120 ("IWE" in TripAdvisor Andorra)
     * - NOTE: TripAdvisor requires a formal Partner Approval Process before granting
     *   access to the Content API. Once approved and key is obtained, configure
     *   TRIPADVISOR_API_KEY in config.local.php or environment.
     */
    public function getTripAdvisorReviews(): void
    {
        $taConfig = $this->config['tripadvisor'] ?? [];
        $apiKey = $taConfig['api_key'] ?? '';
        $locationId = $taConfig['location_id'] ?? 'd18719120';

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
                            'source'      => 'tripadvisor',
                            'is_mock'     => false,
                            'rating'      => 5.0,
                            'location_id' => $locationId,
                            'reviews'     => $json['data'] ?? [],
                        ], 'TripAdvisor reviews recuperadas correctamente.');
                        return;
                    }
                }
            } catch (Throwable $e) {
                error_log('TripAdvisor Content API call failed: ' . $e->getMessage());
                // Fall through to mock response
            }
        }

        // Mock response adhering to TripAdvisor Content API review structure
        $mockData = [
            'source'      => 'tripadvisor',
            'is_mock'     => true,
            'rating'      => 5.0,
            'num_reviews' => 38,
            'location_id' => $locationId,
            'location_name' => 'iWE - Isard Wildland Experience (La Massana)',
            'reviews'     => [
                [
                    'id'             => 'ta_rev_101',
                    'rating'         => 5,
                    'title'          => 'Aventura increíble en los Pirineos',
                    'text'           => 'La mejor experiencia de montaña que hemos tenido en Andorra. Charly adapta todo al ritmo de la familia y te hace sentir completamente seguro. ¡Volveremos seguro!',
                    'published_date' => '2026-02-14',
                    'user'           => [
                        'username' => 'AdventureFamilyUK',
                        'user_location' => [
                            'name' => 'Londres, Reino Unido',
                        ],
                    ],
                    'subratings'     => [
                        'service' => 5,
                        'value'   => 5,
                    ],
                ],
                [
                    'id'             => 'ta_rev_102',
                    'rating'         => 5,
                    'title'          => 'Guías auténticos con pasión real por la montaña',
                    'text'           => 'Contratamos 3 días de BTT y remontes con iWE. Conocen cada sendero y cada trialera secreta. La organización y el equipo técnico son de diez.',
                    'published_date' => '2026-01-20',
                    'user'           => [
                        'username' => 'PyreneesRider',
                        'user_location' => [
                            'name' => 'Toulouse, Francia',
                        ],
                    ],
                    'subratings'     => [
                        'service' => 5,
                        'value'   => 5,
                    ],
                ],
                [
                    'id'             => 'ta_rev_103',
                    'rating'         => 5,
                    'title'          => 'Experiencia 4x4 única en Andorra',
                    'text'           => 'Ruta a los lagos de montaña y al paso de contrabandistas en Tor. Paisajes alucinantes y explicaciones históricas geniales durante el camino. Muy recomendable.',
                    'published_date' => '2025-12-10',
                    'user'           => [
                        'username' => 'Carla_BCN',
                        'user_location' => [
                            'name' => 'Barcelona, España',
                        ],
                    ],
                    'subratings'     => [
                        'service' => 5,
                        'value'   => 5,
                    ],
                ],
            ],
        ];

        jsonSuccess($mockData, 'Mock data de TripAdvisor Reviews generado (requiere aprobación de Partner API y API Key).');
    }
}

