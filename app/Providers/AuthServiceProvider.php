<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Laravel\Passport\Passport;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any application authentication / authorization services.
     *
     * @return void
     */
    public function boot(Request $request)
    {
        $this->registerPolicies();

        // Passport 13 switched to UUID primary keys for oauth_clients by default.
        // We keep bigint IDs so existing client/token rows stay valid through
        // the upgrade (see database/migrations/2026_05_26_000001_upgrade_oauth_clients_for_passport_13.php
        // and vendor/laravel/passport/UPGRADE.md#identify-clients-by-uuids).
        Passport::$clientUuids = false;

        Passport::ignoreCsrfToken(in_array($request->method(), ['HEAD', 'GET', 'OPTIONS']));
    }
}
