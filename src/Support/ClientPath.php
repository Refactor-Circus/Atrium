<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

/**
 * Turns a URL the host app generated (a nav item's, a search result's) into
 * the link the SPA follows: `{path, external}`.
 *
 * - A URL on this app's host (`app.url`), or a relative path, under
 *   `atrium.client_path` becomes the path below it, which the SPA routes to:
 *   with `client_path` `/admin`, `https://app.test/admin/orders` is
 *   `/orders`.
 * - Any other http(s) URL, or a relative path outside `client_path`, is
 *   left as it is and marked external, so the SPA links out.
 * - Anything else is refused with null: other schemes (`javascript:`,
 *   `data:`), protocol-relative `//host` forms, backslashes, whitespace or
 *   control characters around or inside the scheme, mixed-case schemes,
 *   `http:host`, userinfo URLs and bare relative paths. It never throws.
 */
final class ClientPath
{
    private readonly ?string $host;

    /**
     * `''` for the root, otherwise `/{path}` with no trailing slash.
     */
    private readonly string $base;

    public function __construct(?string $appHost, string $clientPath = '/')
    {
        $this->host = $appHost === null || $appHost === '' ? null : strtolower($appHost);

        $clientPath = trim($clientPath, '/');

        $this->base = $clientPath === '' ? '' : '/'.$clientPath;
    }

    /**
     * The link for a URL, against `app.url` and `atrium.client_path`.
     *
     * @return array{path: string, external: bool}|null
     */
    public static function for(?string $url): ?array
    {
        $appUrl = config('app.url');
        $host = is_string($appUrl) ? parse_url($appUrl, PHP_URL_HOST) : null;
        $clientPath = config('atrium.client_path', '/');

        return new self(is_string($host) ? $host : null, is_string($clientPath) ? $clientPath : '/')->link($url);
    }

    /**
     * @return array{path: string, external: bool}|null
     */
    public function link(?string $url): ?array
    {
        if ($url === null || $url === '' || $url !== trim($url) || preg_match('/[\x00-\x1F\x7F\\\\]/', $url) === 1) {
            return null;
        }

        if (str_starts_with($url, '/')) {
            return str_starts_with($url, '//') ? null : $this->local($url, $url);
        }

        // Lower-case http(s) and an authority only: this refuses every other
        // scheme, mixed-case schemes, `http:host` and bare relative paths.
        if (preg_match('#^https?://#', $url) !== 1) {
            return null;
        }

        $parts = parse_url($url);

        if ($parts === false || isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }

        $host = $parts['host'] ?? '';

        if ($host === '') {
            return null;
        }

        if ($this->host === null || strtolower($host) !== $this->host) {
            return ['path' => $url, 'external' => true];
        }

        $authority = substr($url, (int) strpos($url, '://') + 3);
        $rest = substr($authority, strcspn($authority, '/?#'));

        // `https://app.test//evil.test` names a protocol-relative path on this
        // host: refused whatever the client path, like `//evil.test` itself.
        if (str_starts_with($rest, '//')) {
            return null;
        }

        return $this->local(str_starts_with($rest, '/') ? $rest : '/'.$rest, $url);
    }

    /**
     * The link for a path on this app's host: relative to the SPA under the
     * client path, external outside it.
     *
     * @return array{path: string, external: bool}|null
     */
    private function local(string $path, string $url): ?array
    {
        $pathname = substr($path, 0, strcspn($path, '?#'));
        $suffix = substr($path, strlen($pathname));

        if ($this->base === '') {
            $relative = $path;
        } elseif ($pathname === $this->base || $pathname === $this->base.'/') {
            $relative = '/'.$suffix;
        } elseif (str_starts_with($pathname, $this->base.'/')) {
            $relative = substr($path, strlen($this->base));
        } else {
            return ['path' => $url, 'external' => true];
        }

        // `/admin//evil.test` would leave a protocol-relative link behind.
        return str_starts_with($relative, '//') ? null : ['path' => $relative, 'external' => false];
    }
}
