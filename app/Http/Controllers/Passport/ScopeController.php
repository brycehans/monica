<?php

namespace App\Http\Controllers\Passport;

use App\Http\Controllers\Controller;
use Illuminate\Support\Collection;
use Laravel\Passport\Passport;

/**
 * Re-implements the legacy /oauth/scopes endpoint that Passport v11+ removed.
 * See #703. Returns whatever Passport::tokensCan() / addScope() registered
 * at boot — for this fork that's an empty collection unless customised.
 */
class ScopeController extends Controller
{
    public function all(): Collection
    {
        return Passport::scopes();
    }
}
