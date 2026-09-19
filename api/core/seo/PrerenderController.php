<?php
/**
 * iWE Dashboard API - SEO & Social Prerender Controller
 *
 * Serves rich server-rendered Open Graph, Twitter Cards, and JSON-LD structured data
 * to social media crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * and generative AI crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) for:
 *   - Dynamic tour routes  (/tour/:id)
 *   - Article detail routes (/novedades/:slug)
 */

declare(strict_types=1);

class PrerenderController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Renders full HTML with dynamic Open Graph & JSON-LD for a given tour ID.
     */
    public function renderTour(string $tourId): void {
        $tourId = trim($tourId);
        $baseUrl = 'https://i-wildland.com';

        try {
            $stmt = $this->pdo->prepare('SELECT * FROM activities WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $tourId]);
            $activity = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Prerender DB error: ' . $e->getMessage());
            $activity = null;
        }

        if ($activity) {
            $title = $activity['title'] . ' | iWE Andorra';
            $rawDesc = $activity['intro_text'] ?: ($activity['description'] ?: 'Experiencias de turismo activo y aventura en Andorra y los Pirineos guiadas por expertos.');
            $description = mb_substr(trim(strip_tags(str_replace(['<br>', '<br/>', '</p>'], ' ', $rawDesc))), 0, 220);
            if (mb_strlen($rawDesc) > 220) {
                $description .= '...';
            }

            $image = $activity['image_url'] ?: ($activity['image'] ?: 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg');
            if (str_starts_with($image, '/')) {
                $image = $baseUrl . $image;
            }

            $region = $activity['region'] ?: 'Andorra';
            $type = $activity['type'] ?: 'Aventura';
            $price = $activity['price'] ?? null;
            $canonicalUrl = $baseUrl . '/tour/' . rawurlencode($tourId);

            $schema = [
                '@context'    => 'https://schema.org',
                '@type'       => 'TouristTrip',
                'name'        => $activity['title'],
                'description' => $description,
                'image'       => $image,
                'touristType' => $type,
                'touristDestination' => [
                    '@type'   => 'Place',
                    'name'    => $region . ', Andorra',
                    'address' => [
                        '@type'           => 'PostalAddress',
                        'addressCountry'  => 'AD',
                        'addressLocality' => 'Andorra',
                    ],
                ],
                'provider' => [
                    '@type'     => 'Organization',
                    'name'      => 'Isard Wildland Experience (iWE)',
                    'url'       => $baseUrl,
                    'telephone' => '+376 653 769',
                    'email'     => 'info@i-wildland.com',
                ],
            ];

            if ($price !== null && $price !== '') {
                $schema['offers'] = [
                    '@type'         => 'Offer',
                    'price'         => is_numeric($price) ? (float)$price : $price,
                    'priceCurrency' => 'EUR',
                    'availability'  => 'https://schema.org/InStock',
                    'url'           => $canonicalUrl,
                ];
            }
        } else {
            $title = 'iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra';
            $description = 'Descubre experiencias únicas en Andorra y los Pirineos con guías expertos: BTT, E-Bike Enduro, Vía Ferrata, 4x4, Senderismo, Esquí Tour y Raquetas de Nieve.';
            $image = 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg';
            $canonicalUrl = $baseUrl . '/tour/' . rawurlencode($tourId);
            $schema = [
                '@context' => 'https://schema.org',
                '@type'    => 'TravelAgency',
                'name'     => 'Isard Wildland Experience',
                'url'      => $baseUrl,
                'telephone'=> '+376 653 769',
            ];
        }

        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        ?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="iWE — Isard Wildland Experience">
    <meta property="og:type" content="article">
    <meta property="og:url" content="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:secure_url" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:alt" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Schema.org JSON-LD for Search Engines & Generative AI Crawlers -->
    <script type="application/ld+json">
<?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?>
    </script>

    <!-- Fallback redirect for regular web browsers -->
    <meta http-equiv="refresh" content="0;url=/tour/<?= htmlspecialchars($tourId, ENT_QUOTES, 'UTF-8') ?>">
    <script>
        if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawl|spider|facebook|twitter|whatsapp|telegram|slack|pinterest|perplexity|chatgpt|claude/i)) {
            window.location.replace('/tour/<?= htmlspecialchars($tourId, ENT_QUOTES, 'UTF-8') ?>');
        }
    </script>
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #1d2722; color: #f5f5f5;">
    <h1><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h1>
    <p><?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?></p>
    <p><a style="color: #c4f039;" href="/tour/<?= htmlspecialchars($tourId, ENT_QUOTES, 'UTF-8') ?>">Haz clic aquí para abrir esta experiencia en iWE</a></p>
</body>
</html>
<?php
        exit;
    }

    /**
     * Renders full HTML with dynamic Open Graph & JSON-LD for a given article slug.
     * Only published posts are served; unpublished slugs fall back to the generic iWE card.
     */
    public function renderPost(string $slug): void {
        $slug     = trim($slug);
        $baseUrl  = 'https://i-wildland.com';
        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');

        try {
            // JOIN media to resolve cover_media_id → absolute URL (same pattern as PostsController)
            $stmt = $this->pdo->prepare('
                SELECT p.id, p.title, p.slug, p.body, p.status, p.published_at,
                       m.filename AS cover_filename
                FROM posts p
                LEFT JOIN media m ON p.cover_media_id = m.id
                WHERE p.slug = :slug
                  AND p.status = \'published\'
                LIMIT 1
            ');
            $stmt->execute([':slug' => $slug]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Prerender post DB error: ' . $e->getMessage());
            $post = null;
        }

        if ($post) {
            $title = $post['title'] . ' | iWE Andorra';

            // Sanitize & truncate body to 220 chars — same rule as renderTour()
            $rawDesc = $post['body'] ?: 'Novedades, rutas y relatos de expediciones en Andorra y los Pirineos.';
            $cleanDesc = mb_substr(trim(strip_tags(str_replace(['<br>', '<br/>', '</p>'], ' ', $rawDesc))), 0, 220);
            if (mb_strlen(strip_tags($rawDesc)) > 220) {
                $cleanDesc .= '...';
            }
            $description = $cleanDesc;

            // Resolve cover image — cover_filename comes from LEFT JOIN media
            if (!empty($post['cover_filename'])) {
                $image = $baseUrl . $publicBase . '/' . $post['cover_filename'];
            } else {
                $image = 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg';
            }

            $canonicalUrl = $baseUrl . '/novedades/' . rawurlencode($slug);

            $schema = [
                '@context'         => 'https://schema.org',
                '@type'            => 'BlogPosting',
                'headline'         => $post['title'],
                'description'      => $description,
                'image'            => $image,
                'url'              => $canonicalUrl,
                'datePublished'    => $post['published_at'] ?? '',
                'publisher'        => [
                    '@type' => 'Organization',
                    'name'  => 'Isard Wildland Experience (iWE)',
                    'url'   => $baseUrl,
                ],
            ];
        } else {
            // Fallback — same generic card as renderTour() for missing/unpublished content
            $title        = 'iWE | Isard Wildland Experience — Turismo Activo y Aventura en Andorra';
            $description  = 'Descubre experiencias únicas en Andorra y los Pirineos con guías expertos: BTT, E-Bike Enduro, Vía Ferrata, 4x4, Senderismo, Esquí Tour y Raquetas de Nieve.';
            $image        = 'https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg';
            $canonicalUrl = $baseUrl . '/novedades/' . rawurlencode($slug);
            $schema = [
                '@context' => 'https://schema.org',
                '@type'    => 'TravelAgency',
                'name'     => 'Isard Wildland Experience',
                'url'      => $baseUrl,
                'telephone'=> '+376 653 769',
            ];
        }

        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        ?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="iWE — Isard Wildland Experience">
    <meta property="og:type" content="article">
    <meta property="og:url" content="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:secure_url" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:alt" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?= htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($image, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Schema.org JSON-LD for Search Engines & Generative AI Crawlers -->
    <script type="application/ld+json">
<?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?>
    </script>

    <!-- Fallback redirect for regular web browsers -->
    <meta http-equiv="refresh" content="0;url=/novedades/<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>">
    <script>
        if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawl|spider|facebook|twitter|whatsapp|telegram|slack|pinterest|perplexity|chatgpt|claude/i)) {
            window.location.replace('/novedades/<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>');
        }
    </script>
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #1d2722; color: #f5f5f5;">
    <h1><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h1>
    <p><?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?></p>
    <p><a style="color: #c4f039;" href="/novedades/<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>">Haz clic aquí para leer este artículo en iWE</a></p>
</body>
</html>
<?php
        exit;
    }
}

