<?php
/**
 * iWE Dashboard API - SEO & Social Prerender Controller
 *
 * Serves rich server-rendered Open Graph, Twitter Cards, and JSON-LD structured data
 * to social media crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * and generative AI crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) for:
 *   - Dynamic tour routes  (/tour/:id)
 *   - Article detail routes (/novedades/:slug)
 *
 * All branding, institutional texts, contacts, and meta descriptions are read
 * dynamically from site_content (CMS) to avoid domain hardcoding (NAES §8.2).
 */

declare(strict_types=1);

class PrerenderController {
    private PDO $pdo;
    private array $config;
    private ?array $siteContentCache = null;

    public function __construct(PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    private function getBaseUrl(): string {
        $url = $this->config['app']['site_url'] ?? '';
        if (empty($url) || !is_string($url)) {
            throw new \RuntimeException('site_url config missing');
        }
        return rtrim($url, '/');
    }

    private function getSiteContent(string $key, string $default = ''): string {
        if ($this->siteContentCache === null) {
            $this->siteContentCache = [];
            try {
                $stmt = $this->pdo->query('SELECT content_key, content_value FROM site_content');
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $this->siteContentCache[$row['content_key']] = (string)$row['content_value'];
                }
            } catch (\Throwable $e) {
                error_log('Prerender getSiteContent DB error: ' . $e->getMessage());
            }
        }
        $val = $this->siteContentCache[$key] ?? '';
        return (!empty($val) && is_string($val)) ? trim($val) : $default;
    }

    private function getSeoOgImage(): string {
        $val = $this->getSiteContent('seo_og_image', '');
        if (!empty($val)) {
            return $val;
        }
        $defaultImg = $this->config['seo']['default_og_image'] ?? '';
        return is_string($defaultImg) ? trim($defaultImg) : '';
    }

    /**
     * Renders full HTML with dynamic Open Graph & JSON-LD for a given tour ID.
     */
    public function renderTour(string $tourId): void {
        $tourId = trim($tourId);
        $baseUrl = $this->getBaseUrl();

        $businessName = $this->getSiteContent('business_name', 'Isard Wildland Experience');
        $phone        = $this->getSiteContent('contact_phone', '');
        $email        = $this->getSiteContent('contact_email', '');
        $defaultTitle = $this->getSiteContent('seo_meta_title', $businessName . ' — Turismo Activo y Aventura');
        $defaultDesc  = $this->getSiteContent('seo_meta_description', 'Descubre experiencias únicas en Andorra y los Pirineos con guías expertos.');

        try {
            $stmt = $this->pdo->prepare('SELECT * FROM activities WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $tourId]);
            $activity = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Prerender DB error: ' . $e->getMessage());
            $activity = null;
        }

        if ($activity) {
            $title = $activity['title'] . ' | ' . $businessName;
            $rawDesc = $activity['intro_text'] ?: ($activity['description'] ?: $defaultDesc);
            $description = mb_substr(trim(strip_tags(str_replace(['<br>', '<br/>', '</p>'], ' ', $rawDesc))), 0, 220);
            if (mb_strlen($rawDesc) > 220) {
                $description .= '...';
            }

            $image = $activity['image_url'] ?: ($activity['image'] ?: $this->getSeoOgImage());
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
                    'name'    => $region,
                    'address' => [
                        '@type'           => 'PostalAddress',
                        'addressCountry'  => 'AD',
                        'addressLocality' => $region,
                    ],
                ],
                'provider' => [
                    '@type'     => 'Organization',
                    'name'      => $businessName,
                    'url'       => $baseUrl,
                    'telephone' => $phone,
                    'email'     => $email,
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
            $title = $defaultTitle;
            $description = $defaultDesc;
            $image = $this->getSeoOgImage();
            $canonicalUrl = $baseUrl . '/tour/' . rawurlencode($tourId);
            $schema = [
                '@context' => 'https://schema.org',
                '@type'    => 'TravelAgency',
                'name'     => $businessName,
                'url'      => $baseUrl,
                'telephone'=> $phone,
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
    <meta property="og:site_name" content="<?= htmlspecialchars($businessName, ENT_QUOTES, 'UTF-8') ?>">
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

    <!-- Fallback redirect for regular web browsers that hit this URL directly -->
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
    <p><a style="color: #c4f039;" href="/tour/<?= htmlspecialchars($tourId, ENT_QUOTES, 'UTF-8') ?>">Haz clic aquí para abrir esta experiencia en <?= htmlspecialchars($businessName, ENT_QUOTES, 'UTF-8') ?></a></p>
</body>
</html>
<?php
        exit;
    }

    /**
     * Renders full HTML with dynamic Open Graph & JSON-LD for a given article slug.
     * Only published posts are served; unpublished slugs fall back to the generic brand card.
     */
    public function renderPost(string $slug): void {
        $slug     = trim($slug);
        $baseUrl  = $this->getBaseUrl();
        $publicBase = rtrim($this->config['media']['public_path'] ?? '/api/uploads', '/');

        $businessName = $this->getSiteContent('business_name', 'Isard Wildland Experience');
        $phone        = $this->getSiteContent('contact_phone', '');
        $defaultTitle = $this->getSiteContent('seo_meta_title', $businessName . ' — Turismo Activo y Aventura');
        $defaultDesc  = $this->getSiteContent('seo_meta_description', 'Descubre experiencias únicas en Andorra y los Pirineos con guías expertos.');

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
            $title = $post['title'] . ' | ' . $businessName;
            $rawBody = $post['body'] ?: $defaultDesc;
            $description = mb_substr(trim(strip_tags(str_replace(['<br>', '<br/>', '</p>'], ' ', $rawBody))), 0, 220);
            if (mb_strlen($rawBody) > 220) {
                $description .= '...';
            }

            if (!empty($post['cover_filename'])) {
                $image = $baseUrl . $publicBase . '/' . $post['cover_filename'];
            } else {
                $image = $this->getSeoOgImage();
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
                    'name'  => $businessName,
                    'url'   => $baseUrl,
                ],
            ];
        } else {
            // Fallback — same generic card as renderTour() for missing/unpublished content
            $title        = $defaultTitle;
            $description  = $defaultDesc;
            $image        = $this->getSeoOgImage();
            $canonicalUrl = $baseUrl . '/novedades/' . rawurlencode($slug);
            $schema = [
                '@context' => 'https://schema.org',
                '@type'    => 'TravelAgency',
                'name'     => $businessName,
                'url'      => $baseUrl,
                'telephone'=> $phone,
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
    <meta property="og:site_name" content="<?= htmlspecialchars($businessName, ENT_QUOTES, 'UTF-8') ?>">
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
    <p><a style="color: #c4f039;" href="/novedades/<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>">Haz clic aquí para leer este artículo en <?= htmlspecialchars($businessName, ENT_QUOTES, 'UTF-8') ?></a></p>
</body>
</html>
<?php
        exit;
    }
}
