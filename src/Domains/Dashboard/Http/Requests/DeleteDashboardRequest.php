<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Http\Requests;

use Illuminate\Http\Response;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\DeleteDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\Concerns\ResolvesRouteDashboard;
use RefactorCircus\Atrium\Http\Requests\Request;

final class DeleteDashboardRequest extends Request
{
    use ResolvesRouteDashboard;

    public function authorize(): bool
    {
        return $this->allows('delete', $this->dashboard());
    }

    public function persist(): Response
    {
        app(DeleteDashboardAction::class)->execute($this->dashboard());

        return response()->noContent();
    }
}
