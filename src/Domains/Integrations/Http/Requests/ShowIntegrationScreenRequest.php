<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Http\Requests;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * A screen a suite integration declares (`atrium.screens.show`): its
 * declaration, the `record` it was asked for, and the tabs and sections
 * other packages registered for it, as the layer's screen renders them.
 *
 * The layer page loads the record from the package's own API, so no model
 * is loaded here: `record` is echoed as a string, and extension resolvers
 * receive no record. A list screen's `row.actions` is sent as a plain slot,
 * whose sections the layer renders on each row.
 *
 * A screen no registered integration declares, or one whose integration is
 * flagged off for this user, answers 404. The request reads registries only,
 * so it has no model to authorize: the route group's `viewAtrium` gate
 * decides.
 */
final class ShowIntegrationScreenRequest extends Request
{
    public function persist(): JsonResponse
    {
        $declaration = $this->declaration();
        $record = $this->query('record');

        $screen = Screen::make($declaration->key)
            ->kind($declaration->kind)
            ->slots('header.actions', 'before', 'after', $declaration->kind === Screen::DETAIL ? 'aside' : 'row.actions')
            ->access(fn (string $permission, HttpRequest $request, ?Model $row): bool => Gate::forUser($request->user())
                ->allows($permission, $row === null ? [] : [$row]));

        return new ResolvedScreenResource(app(ScreenExtensions::class)->resolve($screen, $this))
            ->declaredAt($declaration->path, $declaration->subjectType, is_string($record) ? $record : null, $declaration->options)
            ->response();
    }

    protected function declaration(): ScreenDeclaration
    {
        $key = $this->route('screen');

        abort_unless(is_string($key), 404);

        $integration = app(IntegrationRegistry::class)->forScreen($key);

        abort_if($integration === null, 404);
        abort_unless(app(IntegrationFeatures::class)->active($integration, $this), 404);

        $declaration = $integration->screen($key);

        abort_if($declaration === null, 404);

        return $declaration;
    }
}
