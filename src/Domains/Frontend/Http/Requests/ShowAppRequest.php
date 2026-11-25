<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Http\Requests;

use Illuminate\Http\Response;
use RefactorCircus\Atrium\Domains\Frontend\Services\AppPage;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * Atrium's page (D-079): one Blade view for every path under
 * `atrium.client_path`, where the front end routes. The route's middleware
 * (`atrium.client.middleware`: the host's `web` and `auth`, then Authorize)
 * has signed the user in and checked the gate.
 */
final class ShowAppRequest extends Request
{
    public function persist(): Response
    {
        return response()
            ->view('atrium::app', app(AppPage::class)->data($this))
            ->header('Cache-Control', 'no-store, private');
    }
}
