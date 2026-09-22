<?php
/**
 * iWE Dashboard API - API Keys Service Registry
 * 
 * Provides metadata schema, titles, descriptions, documentation URLs,
 * and key configuration specifications for all 8 integrated third-party services.
 */

declare(strict_types=1);

require_once __DIR__ . '/ApiKeysMasker.php';

class ApiKeysRegistry {
    /**
     * Builds the full services configuration schema with masked values.
     */
    public static function getServices(array $localData, array $config = []): array {
        $services = [
            'nvidia_nim' => [
                'id'          => 'nvidia_nim',
                'title'       => 'NVIDIA NIM (Traducción con IA - Predeterminado)',
                'description' => 'Motor de inferencia de IA gratuito de NVIDIA para traducciones automáticas del CMS a Catalán, Inglés y Francés.',
                'docs_url'    => 'https://build.nvidia.com',
                'keys'        => [
                    [
                        'key_name'      => 'NVIDIA_NIM_API_KEY',
                        'label'         => 'API Key de NVIDIA NIM',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('NVIDIA_NIM_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('NVIDIA_NIM_API_KEY', $localData, $config)),
                        'description'   => 'Clave de acceso obtenida gratuitamente en build.nvidia.com.',
                    ],
                    [
                        'key_name'      => 'NVIDIA_NIM_API_URL',
                        'label'         => 'Endpoint URL de la API',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('NVIDIA_NIM_API_URL', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('NVIDIA_NIM_API_URL', $localData, $config) ?: 'https://integrate.api.nvidia.com/v1/chat/completions',
                        'description'   => 'URL del endpoint de inferencia (por defecto NVIDIA OpenSearch / chat/completions).',
                    ],
                    [
                        'key_name'      => 'NVIDIA_NIM_MODEL',
                        'label'         => 'Modelo LLM',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('NVIDIA_NIM_MODEL', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('NVIDIA_NIM_MODEL', $localData, $config) ?: 'meta/llama-3.1-70b-instruct',
                        'description'   => 'Identificador del modelo de lenguaje para traducir (meta/llama-3.1-70b-instruct).',
                    ],
                ],
            ],
            'openai' => [
                'id'          => 'openai',
                'title'       => 'OpenAI (ChatGPT / GPT-4o)',
                'description' => 'Motor de traducción alternativo usando modelos de OpenAI (gpt-4o, gpt-4o-mini).',
                'docs_url'    => 'https://platform.openai.com/api-keys',
                'keys'        => [
                    [
                        'key_name'      => 'OPENAI_API_KEY',
                        'label'         => 'OpenAI API Key',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('OPENAI_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('OPENAI_API_KEY', $localData, $config)),
                        'description'   => 'Clave de API secreta de OpenAI (sk-...).',
                    ],
                    [
                        'key_name'      => 'OPENAI_MODEL',
                        'label'         => 'Modelo OpenAI',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('OPENAI_MODEL', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('OPENAI_MODEL', $localData, $config) ?: 'gpt-4o-mini',
                        'description'   => 'Identificador del modelo (ej: gpt-4o-mini, gpt-4o).',
                    ],
                ],
            ],
            'gemini' => [
                'id'          => 'gemini',
                'title'       => 'Google Gemini',
                'description' => 'Motor de traducción alternativo con Google AI Studio y modelos Gemini Flash / Pro.',
                'docs_url'    => 'https://aistudio.google.com/app/apikey',
                'keys'        => [
                    [
                        'key_name'      => 'GEMINI_API_KEY',
                        'label'         => 'Google Gemini API Key',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('GEMINI_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('GEMINI_API_KEY', $localData, $config)),
                        'description'   => 'Clave de API obtenida en Google AI Studio.',
                    ],
                    [
                        'key_name'      => 'GEMINI_MODEL',
                        'label'         => 'Modelo Gemini',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('GEMINI_MODEL', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('GEMINI_MODEL', $localData, $config) ?: 'gemini-1.5-flash',
                        'description'   => 'Identificador del modelo (ej: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash).',
                    ],
                ],
            ],
            'anthropic' => [
                'id'          => 'anthropic',
                'title'       => 'Anthropic Claude',
                'description' => 'Motor de traducción alternativo usando la API de Claude (Haiku / Sonnet).',
                'docs_url'    => 'https://console.anthropic.com/settings/keys',
                'keys'        => [
                    [
                        'key_name'      => 'ANTHROPIC_API_KEY',
                        'label'         => 'Anthropic API Key',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('ANTHROPIC_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('ANTHROPIC_API_KEY', $localData, $config)),
                        'description'   => 'Clave secreta de Anthropic (sk-ant-...).',
                    ],
                    [
                        'key_name'      => 'ANTHROPIC_MODEL',
                        'label'         => 'Modelo Claude',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('ANTHROPIC_MODEL', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('ANTHROPIC_MODEL', $localData, $config) ?: 'claude-3-5-haiku-20241022',
                        'description'   => 'Identificador del modelo (ej: claude-3-5-haiku-20241022, claude-3-5-sonnet-20241022).',
                    ],
                ],
            ],
            'meta' => [
                'id'          => 'meta',
                'title'       => 'Meta / Facebook / Instagram',
                'description' => 'Credenciales oficiales de Meta Graph API para sincronizar publicaciones y webhooks en tiempo real.',
                'docs_url'    => 'https://developers.facebook.com/apps',
                'keys'        => [
                    [
                        'key_name'      => 'META_PAGE_ID',
                        'label'         => 'Page ID (Facebook)',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_PAGE_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_PAGE_ID', $localData, $config)),
                        'description'   => 'Identificador numérico de la página oficial de Facebook.',
                    ],
                    [
                        'key_name'      => 'META_PAGE_ACCESS_TOKEN',
                        'label'         => 'Page Access Token (Larga duración)',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_PAGE_ACCESS_TOKEN', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_PAGE_ACCESS_TOKEN', $localData, $config)),
                        'description'   => 'Token de acceso a la página con permisos pages_show_list, instagram_basic.',
                    ],
                    [
                        'key_name'      => 'META_IG_USER_ID',
                        'label'         => 'Instagram Business User ID',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_IG_USER_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_IG_USER_ID', $localData, $config)),
                        'description'   => 'Identificador de la cuenta profesional de Instagram conectada a la página.',
                    ],
                    [
                        'key_name'      => 'META_APP_ID',
                        'label'         => 'App ID',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_APP_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_APP_ID', $localData, $config)),
                        'description'   => 'ID de la aplicación en Meta for Developers.',
                    ],
                    [
                        'key_name'      => 'META_APP_SECRET',
                        'label'         => 'App Secret',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_APP_SECRET', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_APP_SECRET', $localData, $config)),
                        'description'   => 'Secreto de la aplicación en Meta for Developers.',
                    ],
                    [
                        'key_name'      => 'META_VERIFY_TOKEN',
                        'label'         => 'Webhook Verify Token',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('META_VERIFY_TOKEN', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('META_VERIFY_TOKEN', $localData, $config)),
                        'description'   => 'Cadena secreta personalizada para validar el handshake de Webhooks de Meta.',
                    ],
                ],
            ],
            'google_places' => [
                'id'          => 'google_places',
                'title'       => 'Google Places (Reseñas Google Maps)',
                'description' => 'API de Google Maps Platform para consultar y sincronizar reseñas reales del negocio.',
                'docs_url'    => 'https://console.cloud.google.com/google/maps-apis',
                'keys'        => [
                    [
                        'key_name'      => 'GOOGLE_PLACES_API_KEY',
                        'label'         => 'Google Places API Key',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('GOOGLE_PLACES_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('GOOGLE_PLACES_API_KEY', $localData, $config)),
                        'description'   => 'API Key de Google Cloud con Places API habilitada.',
                    ],
                    [
                        'key_name'      => 'GOOGLE_PLACE_ID',
                        'label'         => 'Place ID de Google Maps',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('GOOGLE_PLACE_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('GOOGLE_PLACE_ID', $localData, $config) ?: 'CID: 0x364c511f18f0fa2c',
                        'description'   => 'Identificador del local en Google Maps (Place ID ChIJ... o resuelto por CID).',
                    ],
                ],
            ],
            'tripadvisor' => [
                'id'          => 'tripadvisor',
                'title'       => 'TripAdvisor Content API',
                'description' => 'API oficial de TripAdvisor para obtener valoraciones y opiniones verificadas.',
                'docs_url'    => 'https://developer-tripadvisor.com',
                'keys'        => [
                    [
                        'key_name'      => 'TRIPADVISOR_API_KEY',
                        'label'         => 'TripAdvisor API Key',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('TRIPADVISOR_API_KEY', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('TRIPADVISOR_API_KEY', $localData, $config)),
                        'description'   => 'Clave de partner autorizada de TripAdvisor Content API.',
                    ],
                    [
                        'key_name'      => 'TRIPADVISOR_LOCATION_ID',
                        'label'         => 'Location ID',
                        'is_required'   => false,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('TRIPADVISOR_LOCATION_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::resolveValue('TRIPADVISOR_LOCATION_ID', $localData, $config) ?: 'd18719120',
                        'description'   => 'Identificador de ubicación de iWE en TripAdvisor (d18719120).',
                    ],
                ],
            ],
            'telegram' => [
                'id'          => 'telegram',
                'title'       => 'Telegram Bot (Alertas y Salud del Sitio)',
                'description' => 'Bot de Telegram gratuito para recibir alertas de salud del sistema, fallos de seguridad o actualizaciones pendientes.',
                'docs_url'    => 'https://core.telegram.org/bots',
                'keys'        => [
                    [
                        'key_name'      => 'TELEGRAM_BOT_TOKEN',
                        'label'         => 'Telegram Bot Token',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('TELEGRAM_BOT_TOKEN', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('TELEGRAM_BOT_TOKEN', $localData, $config)),
                        'description'   => 'Token del bot generado con @BotFather en Telegram (ej: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11).',
                    ],
                    [
                        'key_name'      => 'TELEGRAM_CHAT_ID',
                        'label'         => 'Telegram Chat ID (Usuario o Canal)',
                        'is_required'   => true,
                        'is_configured' => !empty(ApiKeysMasker::resolveValue('TELEGRAM_CHAT_ID', $localData, $config)),
                        'masked_value'  => ApiKeysMasker::maskValue(ApiKeysMasker::resolveValue('TELEGRAM_CHAT_ID', $localData, $config)),
                        'description'   => 'ID numérico del chat donde se enviarán las notificaciones (ej: 123456789 o -100xxxxxxxxxx).',
                    ],
                ],
            ],
        ];

        return array_values($services);
    }

    /**
     * Resolves the active AI translation engine provider.
     */
    public static function getActiveTranslationProvider(array $localData, array $config = []): string {
        return ApiKeysMasker::resolveValue('AI_TRANSLATION_PROVIDER', $localData, $config)
            ?: ($config['ai_translation']['active_provider'] ?? 'nvidia_nim');
    }
}

