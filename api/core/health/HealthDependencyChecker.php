<?php
/**
 * iWE Dashboard API - Site Health Dependency Checker
 * 
 * Inspects NPM dependencies for both Web Public and Dashboard applications,
 * checks node_modules / package-lock versions, and queries the NPM Registry.
 */

declare(strict_types=1);

class HealthDependencyChecker {
    private string $rootDir;
    private string $cacheDir;
    private string $panelDir;

    private array $knownDescriptions = [
        'react'                        => 'Framework UI Principal',
        'react-dom'                    => 'Renderizador React DOM',
        'react-router-dom'             => 'Enrutamiento SPA',
        'vite'                         => 'Bundler & Servidor de Desarrollo',
        'typescript'                   => 'Compilador TypeScript',
        '@tailwindcss/vite'            => 'Plugin Tailwind CSS v4 para Vite',
        'tailwindcss'                  => 'Motor Tailwind CSS',
        'clsx'                         => 'Utilidad de Clases CSS',
        'tailwind-merge'               => 'Merge Inteligente de Clases Tailwind',
        '@tiptap/react'                => 'Editor de Texto Enriquecido (Tiptap)',
        '@tiptap/starter-kit'          => 'Extensiones Base de Tiptap',
        '@tiptap/extension-placeholder'=> 'Placeholder para Editor Tiptap',
        '@tiptap/pm'                   => 'ProseMirror Core para Tiptap',
        '@vitejs/plugin-react'         => 'Plugin Oficial de React para Vite',
        'vite-plugin-singlefile'       => 'Plugin Bundler Monolítico Vite',
        '@types/node'                  => 'Definiciones de Tipos para Node.js',
        '@types/react'                 => 'Definiciones de Tipos para React',
        '@types/react-dom'             => 'Definiciones de Tipos para React DOM',
    ];

    public function __construct(string $rootDir, string $cacheDir, string $panelDir = 'admin-panel') {
        $this->rootDir = $rootDir;
        $this->cacheDir = $cacheDir;
        $this->panelDir = $panelDir;
    }

    public function inspectDependencies(bool $forceRefresh = false): array {
        $webResults = [];
        $webPkgJson = $this->readJsonFile($this->rootDir . '/package.json') ?: [];
        $webLockJson = $this->readJsonFile($this->rootDir . '/package-lock.json');

        $webPackages = array_unique(array_merge(
            array_keys($webPkgJson['dependencies'] ?? []),
            array_keys($webPkgJson['devDependencies'] ?? [])
        ));

        foreach ($webPackages as $pkgName) {
            $desc = $this->knownDescriptions[$pkgName] ?? (isset($webPkgJson['devDependencies'][$pkgName]) ? 'Herramienta de desarrollo' : 'Dependencia del proyecto');
            $webResults[] = $this->inspectSinglePackage(
                $pkgName,
                $desc,
                $this->rootDir,
                $webPkgJson,
                $webLockJson,
                $forceRefresh
            );
        }

        $dashResults = [];
        $dashDir = $this->rootDir . '/' . $this->panelDir;
        if (!is_dir($dashDir) && is_dir($this->rootDir . '/admin-panel')) {
            $dashDir = $this->rootDir . '/admin-panel';
        }
        $dashPkgJson = $this->readJsonFile($dashDir . '/package.json') ?: [];
        $dashLockJson = $this->readJsonFile($dashDir . '/package-lock.json');

        $dashPackages = array_unique(array_merge(
            array_keys($dashPkgJson['dependencies'] ?? []),
            array_keys($dashPkgJson['devDependencies'] ?? [])
        ));

        foreach ($dashPackages as $pkgName) {
            $desc = $this->knownDescriptions[$pkgName] ?? (isset($dashPkgJson['devDependencies'][$pkgName]) ? 'Herramienta de desarrollo' : 'Dependencia del proyecto');
            $dashResults[] = $this->inspectSinglePackage(
                $pkgName,
                $desc,
                $dashDir,
                $dashPkgJson,
                $dashLockJson,
                $forceRefresh
            );
        }

        return [
            'web'       => $webResults,
            'dashboard' => $dashResults,
        ];
    }

    public function inspectSinglePackage(
        string $pkgName,
        string $description,
        string $projectDir,
        ?array $pkgJson,
        ?array $lockJson,
        bool $forceRefresh
    ): array {
        // 1. Declared version in package.json
        $declared = $pkgJson['dependencies'][$pkgName] ?? $pkgJson['devDependencies'][$pkgName] ?? null;

        // 2. Real installed version
        $installed = null;

        // Try node_modules direct package.json
        $nodeModulesPkg = $projectDir . '/node_modules/' . $pkgName . '/package.json';
        if (is_file($nodeModulesPkg)) {
            $directPkg = $this->readJsonFile($nodeModulesPkg);
            if (!empty($directPkg['version'])) {
                $installed = (string)$directPkg['version'];
            }
        }

        // Fallback to lockfile
        if (!$installed && $lockJson) {
            $installed = $lockJson['packages']['node_modules/' . $pkgName]['version']
                ?? $lockJson['dependencies'][$pkgName]['version']
                ?? null;
        }

        if (!$installed && $declared) {
            $installed = ltrim($declared, '^~>=<');
        }

        if (!$installed) {
            $installed = 'No instalado';
        }

        // 3. Query NPM Registry for latest version
        $latest = $this->fetchNpmLatestVersion($pkgName, $forceRefresh);

        // 4. Calculate severity
        $severity = 'green';
        $statusText = 'Al día';

        if ($installed === 'No instalado') {
            $severity = 'red';
            $statusText = 'Paquete no encontrado en node_modules';
        } elseif ($latest === null) {
            $severity = 'yellow';
            $statusText = 'No se pudo consultar el registry de NPM';
        } else {
            $cleanInstalled = preg_replace('/[^\d\.]/', '', explode('-', $installed)[0]);
            $cleanLatest = preg_replace('/[^\d\.]/', '', explode('-', $latest)[0]);

            if (version_compare($cleanLatest, $cleanInstalled, '<=')) {
                $severity = 'green';
                $statusText = 'Al día';
            } else {
                $instParts = array_map('intval', explode('.', $cleanInstalled));
                $latParts = array_map('intval', explode('.', $cleanLatest));

                $instMajor = $instParts[0] ?? 0;
                $instMinor = $instParts[1] ?? 0;
                $latMajor = $latParts[0] ?? 0;
                $latMinor = $latParts[1] ?? 0;

                if ($latMajor !== $instMajor) {
                    $severity = 'red';
                    $statusText = "Actualización mayor disponible ({$latest})";
                } elseif ($latMinor !== $instMinor) {
                    $severity = 'yellow';
                    $statusText = "Actualización menor disponible ({$latest})";
                } else {
                    $severity = 'yellow';
                    $statusText = "Actualización de parche disponible ({$latest})";
                }
            }
        }

        return [
            'package_name'      => $pkgName,
            'description'       => $description,
            'declared_version'  => $declared ?: 'No declarada',
            'installed_version' => $installed,
            'latest_version'    => $latest ?: 'Desconocida',
            'severity'          => $severity,
            'status_text'       => $statusText,
        ];
    }

    public function fetchNpmLatestVersion(string $pkgName, bool $forceRefresh = false): ?string {
        $safeName = preg_replace('/[^a-zA-Z0-9_\-@]/', '_', $pkgName);
        $cacheFile = $this->cacheDir . "/npm_{$safeName}.json";

        // Check 24-hour cache
        if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
            $cached = $this->readJsonFile($cacheFile);
            if (!empty($cached['version'])) {
                return (string)$cached['version'];
            }
        }

        // Fetch from npm registry
        $url = 'https://registry.npmjs.org/' . urlencode($pkgName) . '/latest';
        if (str_starts_with($pkgName, '@')) {
            // Scoped packages: encode scope and package: @tailwindcss/vite -> @tailwindcss%2Fvite
            $url = 'https://registry.npmjs.org/' . str_replace('/', '%2F', $pkgName) . '/latest';
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: iWE-Health-Checker/1.0'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (!empty($data['version'])) {
                $version = (string)$data['version'];
                file_put_contents($cacheFile, json_encode([
                    'version'    => $version,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]));
                return $version;
            }
        }

        // Return stale cache if available
        if (file_exists($cacheFile)) {
            $cached = $this->readJsonFile($cacheFile);
            if (!empty($cached['version'])) {
                return (string)$cached['version'];
            }
        }

        return null;
    }

    private function readJsonFile(string $filePath): ?array {
        if (!is_file($filePath)) {
            return null;
        }
        $content = file_get_contents($filePath);
        if ($content === false) {
            return null;
        }
        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }
}

