<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use stdClass;

/**
 * WORKBENCH ONLY. A stand-in for every suite package's API, so the served
 * workbench renders each module's pages populated without the packages
 * installed (DemoSuite points the integrations here).
 *
 *   GET /_suite/showroom/products  ->  a page of believable products
 *
 * Answers come from the package's vendored `openapi.json` (the staged
 * module's `client/`, ui/modules/{pkg}/client): the operation's 2xx schema,
 * filled with deterministic values chosen from each property's name and
 * format. Writes answer with the same shape and change nothing. Where a
 * schema types a list loosely (`data: string[]`), the resource schema named
 * after the path (`/products` -> `ProductResource`) fills it instead.
 *
 * Demo states: a path holding `__fail` answers 500, and a list queried with
 * `__empty` in any parameter answers an empty page.
 *
 * A port of the Nuxt playground's stand-in, value for value, so the design
 * bench shows the same records it did.
 */
final class SuiteStandIn
{
    private const array WORDS = ['Aurora', 'Vector', 'Helix', 'Nimbus', 'Quartz', 'Orbit', 'Cobalt', 'Pulse', 'Atlas', 'Zenith', 'Ember', 'Nova', 'Prism', 'Vertex', 'Lumen', 'Strata'];

    private const array NOUNS = ['Mortise lock', 'Exit device', 'Door closer', 'Hinge set', 'Access panel', 'Card reader', 'Strike plate', 'Cylinder', 'Lever trim', 'Kick plate', 'Power supply', 'Keypad'];

    private const array PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton', 'Dennis Ritchie', 'Barbara Liskov', 'Ken Thompson', 'Radia Perlman', 'Tim Berners-Lee', 'Frances Allen'];

    private const array COMPANIES = ['Northwind Traders', 'Initech', 'Umbrella Health', 'Stark Industries', 'Wayne Enterprises', 'Hooli', 'Globex', 'Soylent Corp', 'Tyrell Systems', 'Wonka Industries'];

    private const array SENTENCES = [
        'Synchronised from the upstream catalogue on the last nightly run.',
        'Applies to every channel unless a narrower rule overrides it.',
        'Created during the spring onboarding import.',
        'Reviewed and approved by the operations team.',
        'Pending verification against the supplier feed.',
    ];

    /**
     * @var array<string, array<string, mixed>|null>
     */
    private array $docs = [];

    /**
     * @var array<string, mixed>
     */
    private array $doc = [];

    public function __invoke(Request $request, string $path): Response|JsonResponse
    {
        $headers = [
            'Access-Control-Allow-Origin' => $request->headers->get('origin', '*'),
            'Access-Control-Allow-Headers' => '*',
            'Access-Control-Allow-Methods' => 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        ];

        $method = strtolower($request->getMethod());

        if ($method === 'options') {
            return new Response('', 204, $headers);
        }

        $segments = explode('/', $path);
        $pkg = array_shift($segments) ?? '';
        $doc = $this->load($pkg);
        $route = '/'.implode('/', $segments);
        $found = $doc === null ? null : $this->match($doc, $route, $method);

        if ($doc === null || $found === null) {
            return new JsonResponse(['message' => 'No '.strtoupper($method)." {$route} in ".($pkg !== '' ? $pkg : 'this').' API.'], 404, $headers);
        }

        if (str_contains($route, '__fail') || str_contains((string) $request->getQueryString(), '__fail')) {
            return new JsonResponse(['message' => 'The stand-in failed on purpose.'], 500, $headers);
        }

        $this->doc = $doc;
        $query = $request->query->all();
        $status = '204';
        $response = null;

        foreach ($found['operation']['responses'] ?? [] as $code => $answer) {
            if (str_starts_with((string) $code, '2')) {
                $status = (string) $code;
                $response = $answer;

                break;
            }
        }

        $schema = $this->deref(is_array($response) ? $response : [])['content']['application/json']['schema'] ?? null;

        if (! is_array($schema)) {
            return $status === '204' ? new Response('', 204, $headers) : new JsonResponse(new stdClass, (int) $status, $headers);
        }

        if ($pkg === 'showroom' && $method === 'get' && $found['template'] === '/products/{product}/versions') {
            return new JsonResponse($this->versions(), (int) $status, $headers);
        }

        $page = $query['page'] ?? 1;
        $ctx = ['seed' => $pkg.$found['template'].':'.(is_scalar($page) ? (string) $page : '1'), 'depth' => 0, 'params' => $found['params']];
        $resolved = $this->deref($schema);
        $isList = $method === 'get' && ! str_ends_with($found['template'], '}');
        $data = $resolved['properties']['data'] ?? null;

        if (is_array($data)) {
            $dataSchema = $this->deref($data);
            $isArray = $this->typeOf($dataSchema) === 'array';

            if ($this->isWeak($isArray ? ($dataSchema['items'] ?? null) : $data)) {
                $resource = $this->resourceFor($found['template']);

                if ($resource !== null) {
                    $resolved['properties']['data'] = ($isArray || $isList) ? ['type' => 'array', 'items' => $resource] : $resource;
                    $body = $this->generate($resolved, 'root', $ctx);

                    return new JsonResponse($isList && is_array($body) ? $this->withPaging($body, $query) : $body, (int) $status, $headers);
                }
            }
        }

        $body = $this->generate($resolved, 'root', $ctx);

        return new JsonResponse($isList && is_array($body) && isset($body['data']) && is_array($body['data']) && array_is_list($body['data']) ? $this->withPaging($body, $query) : $body, (int) $status, $headers);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function load(string $pkg): ?array
    {
        if (! array_key_exists($pkg, $this->docs)) {
            $file = dirname(__DIR__, 3)."/ui/modules/{$pkg}/client/openapi.json";
            $decoded = preg_match('/^[a-z]+$/', $pkg) === 1 && is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
            $this->docs[$pkg] = is_array($decoded) ? $decoded : null;
        }

        return $this->docs[$pkg];
    }

    private static function hash(string $text): int
    {
        $h = 2166136261;
        $units = unpack('v*', (string) mb_convert_encoding($text, 'UTF-16LE', 'UTF-8')) ?: [];

        foreach ($units as $unit) {
            $h = (($h ^ $unit) * 16777619) & 0xFFFFFFFF;
        }

        return $h;
    }

    /**
     * @param  list<mixed>  $list
     */
    private static function pick(array $list, string $seed): mixed
    {
        return $list[self::hash($seed) % count($list)];
    }

    /**
     * @param  array<string, mixed>|null  $schema
     * @return array<string, mixed>
     */
    private function deref(?array $schema): array
    {
        $current = $schema ?? [];
        $guard = 0;

        while (isset($current['$ref']) && $guard++ < 10) {
            $ref = (string) $current['$ref'];
            $name = substr($ref, (int) strrpos($ref, '/') + 1);
            $found = str_contains($ref, '/responses/') ? ($this->doc['components']['responses'][$name] ?? []) : ($this->doc['components']['schemas'][$name] ?? []);
            $current = is_array($found) ? $found : [];
        }

        return $current;
    }

    /**
     * @param  array<string, mixed>  $schema
     */
    private function typeOf(array $schema): ?string
    {
        $type = $schema['type'] ?? null;

        if (is_array($type)) {
            foreach ($type as $t) {
                if ($t !== 'null') {
                    return (string) $t;
                }
            }

            return null;
        }

        if (is_string($type)) {
            return $type;
        }

        return isset($schema['properties']) ? 'object' : (isset($schema['items']) ? 'array' : (isset($schema['enum']) ? 'string' : null));
    }

    private function isWeak(mixed $schema): bool
    {
        $s = $this->deref(is_array($schema) ? $schema : null);
        $type = $this->typeOf($s);

        return $type === null || $type === 'string' || ($type === 'object' && ! isset($s['properties']));
    }

    private static function pascal(string $segment): string
    {
        return implode('', array_map(ucfirst(...), preg_split('/[-_]/', $segment) ?: []));
    }

    private static function singular(string $word): string
    {
        return match (true) {
            str_ends_with($word, 'ies') => substr($word, 0, -3).'y',
            str_ends_with($word, 'sses') => substr($word, 0, -2),
            str_ends_with($word, 's') => substr($word, 0, -1),
            default => $word,
        };
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resourceFor(string $template): ?array
    {
        $segments = array_reverse(array_values(array_filter(explode('/', $template), fn (string $s): bool => $s !== '' && ! str_starts_with($s, '{'))));
        $schemas = $this->doc['components']['schemas'] ?? [];
        $names = array_keys(is_array($schemas) ? $schemas : []);

        foreach ($segments as $segment) {
            $base = strtolower(self::pascal(self::singular($segment)));

            foreach ([fn (string $n): bool => strtolower($n) === $base.'resource', fn (string $n): bool => strtolower($n) === $base, fn (string $n): bool => str_ends_with(strtolower($n), $base.'resource')] as $test) {
                foreach ($names as $name) {
                    if ($test((string) $name)) {
                        return $schemas[$name];
                    }
                }
            }
        }

        return null;
    }

    private static function iso(int $milliseconds): string
    {
        return gmdate('Y-m-d\TH:i:s', intdiv($milliseconds, 1000)).'.000Z';
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array{seed: string, depth: int, params: array<string, string>}  $ctx
     */
    private function stringFor(string $name, array $schema, array $ctx, int $index): string
    {
        $seed = "{$ctx['seed']}:{$name}:{$index}";
        $n = self::hash($seed);
        $lower = strtolower($name);
        $owner = explode(':', $ctx['seed'])[0];
        $format = $schema['format'] ?? null;

        if (is_array($schema['enum'] ?? null) && $schema['enum'] !== []) {
            return (string) self::pick(array_values(array_filter($schema['enum'], fn (mixed $v): bool => $v !== null)), $seed);
        }

        foreach ($ctx['params'] as $param => $value) {
            if ($ctx['depth'] <= 2 && ($lower === strtolower($param) || in_array($lower, ['id', 'code', 'slug', 'identifier', 'key', 'name', 'uuid'], true)) && $index === 0 && str_replace('_', '', $lower) === str_replace('_', '', strtolower($param))) {
                return $value;
            }
        }

        $base = gmmktime(9, 0, 0, 11, 23, 2026) * 1000;

        return match (true) {
            $format === 'date-time' || str_ends_with($lower, '_at') || str_ends_with($lower, '_since') || str_ends_with($lower, 'until') => self::iso($base - ($n % (60 * 24 * 21)) * 60_000),
            $format === 'date' || str_ends_with($lower, '_on') || $lower === 'date' => substr(self::iso(gmmktime(0, 0, 0, 11, 23, 2026) * 1000 - ($n % 90) * 86_400_000), 0, 10),
            $format === 'email' || str_contains($lower, 'email') => strtolower(explode(' ', (string) self::pick(self::PEOPLE, $seed))[0]).'@'.self::pick(['acme', 'globex', 'initech', 'hooli'], "{$seed}d").'.test',
            $format === 'uri' || str_ends_with($lower, 'url') || $lower === 'href' || str_ends_with($lower, '_uri') => 'https://assets.example.test/'.base_convert((string) ($n % 9000 + 1000), 10, 36),
            $lower === 'uuid' || $format === 'uuid' || str_ends_with($lower, '_uuid') => substr(str_pad(dechex($n), 8, '0', STR_PAD_LEFT).'-4b1e-4c'.str_pad((string) ($n % 99), 2, '0', STR_PAD_LEFT).'-9a'.($n % 7).'e-1f2c3d4e5f6a', 0, 36),
            $lower === 'ip' || str_contains($lower, 'ip_address') || $lower === 'cidr' => '203.0.113.'.($n % 254 + 1).($lower === 'cidr' ? '/32' : ''),
            $lower === 'id' || str_ends_with($lower, '_id') => (string) (1000 + ($n % 8999)),
            in_array($lower, ['code', 'identifier', 'sku', 'key', 'slug', 'handle', 'reference', 'number', 'external_id'], true) || str_ends_with($lower, '_code') || str_ends_with($lower, '_key') => $this->code($lower, $seed, $n),
            $lower === 'locale' => 'en_US',
            $lower === 'currency' => 'USD',
            str_contains($lower, 'user') || str_contains($lower, 'author') || str_contains($lower, 'actor') || str_contains($lower, 'causer') || $lower === 'owner_name' || str_contains($lower, 'person') => (string) self::pick(self::PEOPLE, $seed),
            str_contains($lower, 'company') || str_contains($lower, 'organization') || str_contains($lower, 'organisation') || str_contains($lower, 'tenant') => (string) self::pick(self::COMPANIES, $seed),
            ($lower === 'name' || $lower === 'display_name') && preg_match('/user|member|impersonat|identit/', $owner) === 1 => (string) self::pick(self::PEOPLE, $seed),
            $lower === 'name' && preg_match('/organi[sz]ation|tenant|compan/', $owner) === 1 => (string) self::pick(self::COMPANIES, $seed),
            $lower === 'name' || $lower === 'label' || $lower === 'title' || str_ends_with($lower, '_name') || str_ends_with($lower, '_label') => self::pick(self::WORDS, $seed).' '.self::pick(self::NOUNS, "{$seed}n"),
            str_contains($lower, 'description') || str_contains($lower, 'message') || str_contains($lower, 'summary') || str_contains($lower, 'notes') || str_contains($lower, 'reason') || str_contains($lower, 'instructions') || $lower === 'body' || $lower === 'text' => (string) self::pick(self::SENTENCES, $seed),
            str_contains($lower, 'status') || $lower === 'state' => (string) self::pick(['active', 'pending', 'completed', 'failed'], $seed),
            $lower === 'type' || str_ends_with($lower, '_type') || $lower === 'kind' || $lower === 'driver' || $lower === 'method' => (string) self::pick(['standard', 'scheduled', 'manual', 'webhook'], $seed),
            str_contains($lower, 'version') => 'v'.(1 + ($n % 4)).'.'.($n % 10).'.'.($n % 7),
            default => self::pick(self::WORDS, $seed).' '.($n % 100),
        };
    }

    private function code(string $lower, string $seed, int $n): string
    {
        $word = strtolower((string) self::pick(self::WORDS, $seed));

        return in_array($lower, ['sku', 'identifier', 'number'], true)
            ? strtoupper(substr($word, 0, 3)).'-'.(1000 + ($n % 8999))
            : $word.'-'.($n % 97);
    }

    /**
     * @param  array<string, mixed>|null  $schema
     * @param  array{seed: string, depth: int, params: array<string, string>}  $ctx
     */
    private function generate(?array $schema, string $name, array $ctx, int $index = 0): mixed
    {
        $s = $this->deref($schema);

        if ($ctx['depth'] > 7) {
            return null;
        }

        $choice = $s['oneOf'] ?? $s['anyOf'] ?? null;

        if (is_array($choice)) {
            $options = array_values(array_filter($choice, fn (mixed $option): bool => is_array($option) && ($this->deref($option)['type'] ?? null) !== 'null'));

            return $this->generate($options[0] ?? [], $name, $ctx, $index);
        }

        if (is_array($s['allOf'] ?? null)) {
            $merged = [];

            foreach ($s['allOf'] as $part) {
                $value = $this->generate(is_array($part) ? $part : [], $name, $ctx, $index);
                $merged = [...$merged, ...(is_array($value) ? $value : [])];
            }

            return $merged === [] ? new stdClass : $merged;
        }

        $type = $this->typeOf($s);
        $seed = "{$ctx['seed']}:{$name}:{$index}";

        if (($name === 'associations' || $name === 'quantified_associations') && str_starts_with($ctx['seed'], 'showroom')) {
            return ['related' => ['products' => [strtoupper(substr((string) self::pick(self::WORDS, $seed), 0, 3)).'-2041'], 'product_models' => [], 'groups' => []]];
        }

        if ($name === 'values' && str_starts_with($ctx['seed'], 'showroom')) {
            return [
                'name' => [['scope' => null, 'locale' => 'en_US', 'data' => self::pick(self::WORDS, $seed).' '.self::pick(self::NOUNS, "{$seed}n")]],
                'description' => [['scope' => null, 'locale' => 'en_US', 'data' => self::pick(self::SENTENCES, $seed)]],
            ];
        }

        $n = self::hash($seed);
        $lower = strtolower($name);
        $inner = ['seed' => $seed, 'depth' => $ctx['depth'] + 1, 'params' => $ctx['params']];

        switch ($type) {
            case 'object':
                if (! is_array($s['properties'] ?? null)) {
                    if ($lower === 'categories' || $lower === 'flags') {
                        return array_map(fn (int $i): string => strtolower((string) self::pick(self::WORDS, "{$seed}{$i}")).'-'.($i + 1), [0, 1]);
                    }

                    if ($lower === 'labels' || str_ends_with($lower, '_labels') || $lower === 'translations') {
                        return ['en_US' => self::pick(self::WORDS, $seed).' '.self::pick(self::NOUNS, "{$seed}n")];
                    }

                    return new stdClass;
                }

                $object = [];

                foreach ($s['properties'] as $key => $value) {
                    $object[(string) $key] = $this->generate(is_array($value) ? $value : [], (string) $key, $inner, 0);
                }

                return $object === [] ? new stdClass : $object;

            case 'array':
                $count = $ctx['depth'] <= 1 ? 14 : ($ctx['depth'] <= 3 ? 3 : 1);
                $items = is_array($s['items'] ?? null) ? $s['items'] : ['type' => 'string'];

                return array_map(fn (int $i): mixed => $this->generate($items, self::singular($name), [...$inner, 'seed' => "{$seed}#{$i}"], $i), range(0, $count - 1));

            case 'integer':
            case 'number':
                $max = is_numeric($s['maximum'] ?? null) ? (int) $s['maximum'] : (str_contains($lower, 'ratio') || str_contains($lower, 'percent') ? 100 : (str_contains($lower, 'count') || str_contains($lower, 'total') ? 480 : 240));
                $min = is_numeric($s['minimum'] ?? null) ? (int) $s['minimum'] : 0;

                return $min + ($n % max(1, $max - $min + 1));

            case 'boolean':
                return $n % 4 !== 0;

            case 'null':
                return null;

            default:
                return $this->stringFor($name, $s, $ctx, $index);
        }
    }

    /**
     * @param  array<string, mixed>  $doc
     * @return array{template: string, operation: array<string, mixed>, params: array<string, string>}|null
     */
    private function match(array $doc, string $path, string $method): ?array
    {
        $best = null;
        $bestScore = -1;

        foreach ($doc['paths'] ?? [] as $template => $operations) {
            $operation = is_array($operations) ? ($operations[$method] ?? null) : null;

            if (! is_array($operation)) {
                continue;
            }

            $names = [];
            $pattern = preg_replace_callback('/\\\\\{([^}]+)\\\\\}/', function (array $m) use (&$names): string {
                $names[] = $m[1];

                return '([^/]+)';
            }, preg_quote((string) $template, '#'));

            if (preg_match('#^'.$pattern.'/?$#', $path, $found) === 1) {
                $score = count(array_filter(explode('/', (string) $template), fn (string $s): bool => $s !== '' && ! str_starts_with($s, '{')));

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $params = [];

                    foreach ($names as $i => $param) {
                        $params[$param] = rawurldecode($found[$i + 1]);
                    }

                    $best = ['template' => (string) $template, 'operation' => $operation, 'params' => $params];
                }
            }
        }

        return $best;
    }

    /**
     * @param  array<array-key, mixed>  $body
     * @param  array<array-key, mixed>  $query
     * @return array<array-key, mixed>
     */
    private function withPaging(array $body, array $query): array
    {
        $page = (int) ($query['page'] ?? 1) ?: 1;
        $meta = is_array($body['meta'] ?? null) ? $body['meta'] : [];

        foreach ($query as $value) {
            if (is_scalar($value) && str_contains((string) $value, '__empty')) {
                return [...$body, 'data' => [], 'meta' => [...$meta, 'current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'from' => null, 'to' => null, 'total' => 0], 'links' => ['first' => '?page=1', 'last' => '?page=1', 'prev' => null, 'next' => null]];
            }
        }

        $count = is_array($body['data'] ?? null) ? count($body['data']) : 0;

        return [
            ...$body,
            'meta' => [...$meta, 'current_page' => $page, 'last_page' => 4, 'per_page' => $count, 'from' => ($page - 1) * $count + 1, 'to' => $page * $count, 'total' => $count * 4 - 5],
            'links' => ['first' => '?page=1', 'last' => '?page=4', 'prev' => $page > 1 ? '?page='.($page - 1) : null, 'next' => $page < 4 ? '?page='.($page + 1) : null],
        ];
    }

    /**
     * @return array{data: list<array<string, mixed>>}
     */
    private function versions(): array
    {
        return ['data' => array_map(fn (int $version): array => [
            'version' => $version,
            'status' => $version === 3 ? 'draft' : 'approved',
            'published' => $version === 2,
            'changes' => $version === 1 ? ['created' => true] : ['name' => 'changed', 'description' => 'changed'],
            'author_type' => 'user',
            'author_id' => 7,
            'created_at' => self::iso(gmmktime(10, 0, 0, 11, 20 - $version * 3, 2026) * 1000),
        ], [3, 2, 1])];
    }
}
