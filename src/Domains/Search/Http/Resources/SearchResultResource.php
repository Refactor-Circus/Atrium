<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Http\Resources;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\Request;
use Illuminate\JsonSchema\Types\Type;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Support\ClientPath;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * One global search result. Its URL goes out only as `link`, the
 * `{path, external}` ClientPath makes of it, or null for a URL ClientPath
 * refuses (`javascript:`, `//host` and the like), so the layer never follows
 * a URL ClientPath has not checked.
 *
 * @mixin SearchResult
 *
 * @property SearchResult $resource
 */
final class SearchResultResource extends JsonResource
{
    /**
     * A search result as `toArray()` sends it.
     *
     * @return array<string, Type>
     */
    public static function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->required(),
            'subtitle' => $schema->string()->nullable()->required(),
            'icon' => $schema->string()->nullable()->description('An Iconify name.')->required(),
            'group' => $schema->string()->nullable()->required(),
            'link' => $schema->object([
                'path' => $schema->string()->description('A path inside the SPA, or an absolute http(s) URL when external.')->required(),
                'external' => $schema->boolean()->required(),
            ])->nullable()->description('Null for a URL ClientPath refuses.')->required(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $result = $this->resource;

        return [
            'title' => $result->title,
            'subtitle' => $result->subtitle,
            'icon' => $result->icon,
            'group' => $result->group,
            'link' => ClientPath::for($result->url),
        ];
    }
}
