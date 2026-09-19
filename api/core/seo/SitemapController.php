<?php
/**
 * iWE Dashboard API - Sitemap Generator Controller
 * 
 * Dynamically generates a valid XML Sitemap (sitemap.xml) for search engines
 * (Google, Bing) and AI crawlers (GPTBot, PerplexityBot, ClaudeBot), indexing
 * all published activities, articles, and static pages.
 */

declare(strict_types=1);

class SitemapController {
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Outputs dynamic XML sitemap.
     */
    public function render(): void {
        $baseUrl = 'https://i-wildland.com';
        $nowDate = date('Y-m-d');

        // Fetch published activities
        $activities = [];
        try {
            $stmt = $this->pdo->query('
                SELECT id, updated_at, created_at 
                FROM activities 
                WHERE published = 1 
                ORDER BY display_order ASC, created_at ASC
            ');
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Sitemap activities query error: ' . $e->getMessage());
        }

        // Fetch published posts
        $posts = [];
        try {
            $stmt = $this->pdo->query("
                SELECT slug, published_at, updated_at, created_at 
                FROM posts 
                WHERE status = 'published' 
                ORDER BY published_at DESC, created_at DESC
            ");
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Sitemap posts query error: ' . $e->getMessage());
        }

        header('Content-Type: application/xml; charset=utf-8');
        header('X-Robots-Tag: noindex, follow');

        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // 1. Homepage
        echo "  <url>\n";
        echo "    <loc>" . htmlspecialchars($baseUrl . '/', ENT_XML1, 'UTF-8') . "</loc>\n";
        echo "    <lastmod>{$nowDate}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>1.0</priority>\n";
        echo "  </url>\n";

        // 2. Novedades / News index
        echo "  <url>\n";
        echo "    <loc>" . htmlspecialchars($baseUrl . '/novedades', ENT_XML1, 'UTF-8') . "</loc>\n";
        echo "    <lastmod>{$nowDate}</lastmod>\n";
        echo "    <changefreq>daily</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";

        // 3. Privacy Policy
        echo "  <url>\n";
        echo "    <loc>" . htmlspecialchars($baseUrl . '/privacidad', ENT_XML1, 'UTF-8') . "</loc>\n";
        echo "    <lastmod>2026-09-17</lastmod>\n";
        echo "    <changefreq>monthly</changefreq>\n";
        echo "    <priority>0.3</priority>\n";
        echo "  </url>\n";

        // 4. Published Activities (Tours)
        foreach ($activities as $act) {
            $actId = (string)$act['id'];
            $loc = $baseUrl . '/tour/' . rawurlencode($actId);
            $lastmod = !empty($act['updated_at']) 
                ? substr((string)$act['updated_at'], 0, 10) 
                : (!empty($act['created_at']) ? substr((string)$act['created_at'], 0, 10) : $nowDate);

            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($loc, ENT_XML1, 'UTF-8') . "</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.9</priority>\n";
            echo "  </url>\n";
        }

        // 5. Published Blog Posts
        foreach ($posts as $post) {
            $slug = (string)$post['slug'];
            $loc = $baseUrl . '/novedades/' . rawurlencode($slug);
            $lastmod = !empty($post['published_at'])
                ? substr((string)$post['published_at'], 0, 10)
                : (!empty($post['updated_at']) 
                    ? substr((string)$post['updated_at'], 0, 10) 
                    : $nowDate);

            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($loc, ENT_XML1, 'UTF-8') . "</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>monthly</changefreq>\n";
            echo "    <priority>0.7</priority>\n";
            echo "  </url>\n";
        }

        echo '</urlset>' . "\n";
    }
}
