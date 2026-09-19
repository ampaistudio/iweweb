<?php
/**
 * iWE Dashboard API - Front Controller & Router
 * 
 * Dispatches all /api/* requests with security headers, CORS, session handling,
 * and standard REST routing.
 */

declare(strict_types=1);

// Error reporting: Log errors without breaking JSON responses
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Load configurations and dependencies
$config = require __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/core/helpers.php';

// Load Core Controllers
require_once __DIR__ . '/core/auth/AuthController.php';
require_once __DIR__ . '/core/media/MediaController.php';
require_once __DIR__ . '/core/content/ContentController.php';
require_once __DIR__ . '/core/hero/HeroSlideController.php';
require_once __DIR__ . '/core/social/MetaGraphService.php';
require_once __DIR__ . '/core/social/WebhookController.php';
require_once __DIR__ . '/core/posts/PostsController.php';
require_once __DIR__ . '/core/translation/TranslationController.php';
require_once __DIR__ . '/core/reviews/ReviewsController.php';
require_once __DIR__ . '/core/menu/MenuController.php';
require_once __DIR__ . '/core/packages/PackageController.php';
require_once __DIR__ . '/core/settings/ApiKeysController.php';
require_once __DIR__ . '/core/health/SiteHealthController.php';

// Load Domain Controllers (iWE Tourism)
require_once __DIR__ . '/activities/ActivityController.php';
require_once __DIR__ . '/activities/ActivityTypeController.php';

// Handle CORS & Options pre-flight
handleCors($config);

// Initialize secure session
startAppSession($config);

// Initialize Database connection
try {
    $pdo = Database::getConnection($config['db']);
} catch (Throwable $e) {
    jsonError('No se pudo establecer conexión con la base de datos.', 500);
}

// Extract Request Method and Path
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Normalize path: strip script directory or /api prefix
$basePath = '/api';
if (str_starts_with($uri, $basePath)) {
    $path = substr($uri, strlen($basePath));
} else {
    $path = $uri;
}
$path = '/' . trim($path, '/');
$segments = array_values(array_filter(explode('/', $path)));

// -----------------------------------------------------------------------------
// Router Dispatcher
// -----------------------------------------------------------------------------
try {
    // Health / Root check
    if (empty($segments) || ($segments[0] === '' && count($segments) === 1)) {
        jsonSuccess([
            'status'  => 'ok',
            'version' => '1.0.0',
            'service' => 'iWE Dashboard API',
            'time'    => date('c'),
        ], 'iWE API funcionando correctamente.');
    }

    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;

    // --- Static uploads (PHP built-in server only; Apache/.htaccess serves these directly in production) ---
    if ($resource === 'uploads') {
        if ($method !== 'GET') {
            jsonError('Método no permitido para /api/uploads', 405);
        }
        $filename = $segments[1] ?? '';
        if ($filename === '' || !preg_match('/^[a-f0-9]+\.(jpg|jpeg|png|webp)$/i', $filename)) {
            jsonError('Archivo no encontrado.', 404);
        }
        $uploadDir = rtrim($config['media']['upload_dir'] ?? (__DIR__ . '/uploads'), '/');
        $filePath = $uploadDir . '/' . $filename;
        if (!is_file($filePath)) {
            jsonError('Archivo no encontrado.', 404);
        }
        $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($filePath);
        exit;
    }

    // --- Overview Summary (Dashboard Overview) ---
    if ($resource === 'overview' && $method === 'GET') {
        requireAuth($pdo);
        
        $totalActivities = (int)$pdo->query('SELECT COUNT(*) FROM activities')->fetchColumn();
        $publishedActivities = (int)$pdo->query('SELECT COUNT(*) FROM activities WHERE published = 1')->fetchColumn();
        $totalMedia = (int)$pdo->query('SELECT COUNT(*) FROM media')->fetchColumn();
        $totalPosts = (int)$pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();
        $publishedPosts = (int)$pdo->query('SELECT COUNT(*) FROM posts WHERE status = "published"')->fetchColumn();
        
        $lastActivity = $pdo->query('SELECT title, updated_at FROM activities ORDER BY updated_at DESC LIMIT 1')->fetch();
        $lastPost = $pdo->query('SELECT title, updated_at FROM posts ORDER BY updated_at DESC LIMIT 1')->fetch();

        jsonSuccess([
            'activities' => [
                'total'     => $totalActivities,
                'published' => $publishedActivities,
                'last_edit' => $lastActivity ?: null,
            ],
            'posts' => [
                'total'     => $totalPosts,
                'published' => $publishedPosts,
                'last_edit' => $lastPost ?: null,
            ],
            'media' => [
                'total' => $totalMedia,
            ],
        ]);
    }

    // --- Auth Endpoints ---
    if ($resource === 'auth') {
        $authController = new AuthController($pdo, $config);
        $action = $segments[1] ?? '';

        if ($action === 'login' && $method === 'POST') {
            $authController->login();
        } elseif ($action === 'logout' && $method === 'POST') {
            $authController->logout();
        } elseif ($action === 'me' && $method === 'GET') {
            $authController->me();
        } else {
            jsonError('Acción de autenticación no válida.', 404);
        }
    }

    // --- Activities Endpoints ---
    if ($resource === 'activities') {
        $activityController = new ActivityController($pdo, $config);
        $subresource = $segments[2] ?? null;
        $subId = $segments[3] ?? null;
        $subAction = $segments[4] ?? null;

        // Sub-resource: /api/activities/:id/images[/:imageId[/cover]]
        if ($subresource === 'images') {
            $activityId = (string)$id;
            if ($subId === null) {
                if ($method === 'POST') {
                    $activityController->addImage($activityId);
                } elseif ($method === 'PUT') {
                    $activityController->reorderImages($activityId);
                }
            } elseif ($subAction === 'cover' && $method === 'PUT') {
                $activityController->setCoverImage((int)$subId);
            } elseif ($method === 'DELETE') {
                $activityController->removeImage((int)$subId);
            } elseif ($method === 'PUT') {
                $activityController->setCoverImage((int)$subId);
            }
            jsonError('Método no permitido para /api/activities/:id/images', 405);
        }

        // Sub-resource: /api/activities/:id/duplicate
        if ($subresource === 'duplicate' && $id !== null) {
            if ($method === 'POST') {
                $activityController->duplicate((string)$id);
            }
            jsonError('Método no permitido para /api/activities/:id/duplicate', 405);
        }

        if ($id === null) {
            if ($method === 'GET') {
                $activityController->list();
            } elseif ($method === 'POST') {
                $activityController->create();
            }
        } else {
            if ($method === 'GET') {
                $activityController->get((string)$id);
            } elseif ($method === 'PUT') {
                $activityController->update((string)$id);
            } elseif ($method === 'DELETE') {
                $activityController->delete((string)$id);
            }
        }
        jsonError('Método no permitido para /api/activities', 405);
    }

    // --- Content Endpoints ---
    if ($resource === 'content') {
        $contentController = new ContentController($pdo, $config);

        if ($id === null && $method === 'GET') {
            $contentController->list();
        } elseif ($id !== null && $method === 'PUT') {
            $contentController->update((string)$id);
        }
        jsonError('Método no permitido para /api/content', 405);
    }

    // --- Hero Slides Endpoints ---
    if ($resource === 'hero-slides') {
        $heroController = new HeroSlideController($pdo, $config);

        if ($id === null) {
            if ($method === 'GET') {
                $heroController->listPublic();
            } elseif ($method === 'POST') {
                $heroController->create();
            }
        } elseif ($id === 'all' && $method === 'GET') {
            $heroController->listAll();
        } elseif ($id === 'reorder' && $method === 'PUT') {
            $heroController->reorder();
        } else {
            if ($method === 'PUT') {
                $heroController->update((int)$id);
            } elseif ($method === 'DELETE') {
                $heroController->delete((int)$id);
            }
        }
        jsonError('Método no permitido para /api/hero-slides', 405);
    }

    // --- Media Endpoints ---
    if ($resource === 'media') {
        $mediaController = new MediaController($pdo, $config);
        $mediaController->addUsageChecker([ActivityController::class, 'checkMediaUsage']);

        if ($id === null) {
            if ($method === 'GET') {
                $mediaController->list();
            } elseif ($method === 'POST') {
                $mediaController->upload();
            }
        } else {
            if ($method === 'DELETE') {
                $mediaController->delete((int)$id);
            }
        }
        jsonError('Método no permitido para /api/media', 405);
    }

    // --- Posts Endpoints ---
    if ($resource === 'posts') {
        $postsController = new PostsController($pdo, $config);

        if ($id === null) {
            if ($method === 'GET') {
                $postsController->list();
            } elseif ($method === 'POST') {
                $postsController->create();
            }
        } else {
            if ($method === 'GET') {
                $postsController->get((string)$id);
            } elseif ($method === 'PUT') {
                $postsController->update((int)$id);
            } elseif ($method === 'DELETE') {
                $postsController->delete((int)$id);
            }
        }
        jsonError('Método no permitido para /api/posts', 405);
    }

    // --- AI Translation Endpoint ---
    if ($resource === 'translate') {
        $translationController = new TranslationController($pdo, $config);
        if ($method === 'POST') {
            $translationController->translate();
        }
        jsonError('Método no permitido para /api/translate', 405);
    }

    // --- Reviews Endpoints (Google & TripAdvisor) ---
    if ($resource === 'reviews') {
        $reviewsController = new ReviewsController($pdo, $config);
        $provider = $segments[1] ?? '';

        if ($provider === 'google' && $method === 'GET') {
            $reviewsController->getGoogleReviews();
        } elseif ($provider === 'tripadvisor' && $method === 'GET') {
            $reviewsController->getTripAdvisorReviews();
        }
        jsonError('Proveedor de reviews no encontrado o método no permitido.', 404);
    }

    // --- Menu Hierarchy Endpoints ---
    if ($resource === 'menu') {
        $menuController = new MenuController($pdo, $config);

        if ($id === null) {
            if ($method === 'GET') {
                $menuController->list();
            } elseif ($method === 'POST') {
                $menuController->create();
            }
        } elseif ($id === 'reorder' && $method === 'PUT') {
            $menuController->reorder();
        } else {
            if ($method === 'GET') {
                $menuController->get((int)$id);
            } elseif ($method === 'PUT') {
                $menuController->update((int)$id);
            } elseif ($method === 'DELETE') {
                $menuController->delete((int)$id);
            }
        }
        jsonError('Método no permitido para /api/menu', 405);
    }

    // --- Multi-day Packages Endpoints ---
    if ($resource === 'packages') {
        $packageController = new PackageController($pdo, $config);

        if ($id === null) {
            if ($method === 'GET') {
                $packageController->list();
            } elseif ($method === 'POST') {
                $packageController->create();
            }
        } elseif ($id === 'reorder' && $method === 'PUT') {
            $packageController->reorder();
        } else {
            if ($method === 'GET') {
                $packageController->get((string)$id);
            } elseif ($method === 'PUT') {
                $packageController->update((string)$id);
            } elseif ($method === 'DELETE') {
                $packageController->delete((string)$id);
            }
        }
        jsonError('Método no permitido para /api/packages', 405);
    }

    // --- Activity Categories (Types) Endpoints ---
    if ($resource === 'activity-types') {
        $activityTypeController = new ActivityTypeController($pdo, $config);

        if ($id === null) {
            if ($method === 'GET') {
                $activityTypeController->list();
            } elseif ($method === 'POST') {
                $activityTypeController->create();
            }
        } elseif ($id === 'reorder' && $method === 'PUT') {
            $activityTypeController->reorder();
        } else {
            if ($method === 'PUT') {
                $activityTypeController->update((int)$id);
            } elseif ($method === 'DELETE') {
                $activityTypeController->delete((int)$id);
            }
        }
        jsonError('Método no permitido para /api/activity-types', 405);
    }

    // --- Social / Webhook Endpoints ---
    if ($resource === 'social') {
        $sub = $segments[1] ?? '';
        if ($sub === 'webhook') {
            $webhookController = new WebhookController($pdo, $config);
            $webhookController->handle();
        }
        jsonError('Ruta social no encontrada.', 404);
    }

    // --- Settings & API Keys Endpoints ---
    if ($resource === 'settings') {
        $sub = $segments[1] ?? '';
        if ($sub === 'api-keys') {
            $apiKeysController = new ApiKeysController($pdo, $config);
            $action = $segments[2] ?? null;

            if ($action === null) {
                if ($method === 'GET') {
                    $apiKeysController->getKeys();
                } elseif ($method === 'POST') {
                    $apiKeysController->saveKey();
                }
            } elseif ($action === 'test' && $method === 'POST') {
                $apiKeysController->testConnection();
            } elseif ($method === 'DELETE' && $action !== null) {
                $apiKeysController->deleteCustomKey((string)$action);
            }
            jsonError('Método no permitido para /api/settings/api-keys', 405);
        }
        jsonError('Ruta de configuración no encontrada.', 404);
    }

    // --- Site Health, Diagnostics & Backups Endpoints ---
    if ($resource === 'health') {
        $healthController = new SiteHealthController($pdo, $config);
        $sub = $segments[1] ?? '';

        if ($sub === 'status' && $method === 'GET') {
            $healthController->getStatus();
        } elseif ($sub === 'backup' && $method === 'POST') {
            $healthController->createBackup();
        } elseif ($sub === 'backups') {
            $backupFilename = $segments[2] ?? null;
            if ($backupFilename === null && $method === 'GET') {
                $healthController->listBackups();
            } elseif ($backupFilename !== null && $method === 'GET') {
                $healthController->downloadBackup((string)$backupFilename);
            }
            jsonError('Método no permitido para /api/health/backups', 405);
        } elseif ($sub === 'notify' && $method === 'POST') {
            $healthController->notifyTelegram();
        }

        jsonError('Ruta de salud del sitio no encontrada.', 404);
    }

    // Unmatched route
    jsonError("Ruta '{$uri}' no encontrada en la API.", 404);

} catch (Throwable $e) {
    error_log('Unhandled API exception: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    jsonError('Error interno del servidor: ' . $e->getMessage(), 500);
}
