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
    public function register()
    {
        parent::register();

        // Passport 13 ships the RFC 8628 device-authorization grant enabled by
        // default and registers /oauth/device, /oauth/device/code, and
        // /oauth/device/authorize. Monica's mobile/API clients use only the
        // password and authorization-code grants, so the device-grant surface
        // is unused — and the companion `oauth_device_codes` table was not
        // published alongside the other Passport migrations in #677, which
        // means DeviceCodeRepository would hit a missing-table 500 on every
        // request to those endpoints. Disabling the grant suppresses the
        // routes entirely. The migration is still shipped (this same PR) so
        // the schema stays coherent if the grant is ever re-enabled.
        //
        // The flag MUST be set in register(), not boot(): Passport is
        // auto-discovered via Composer's `extra.laravel.providers`, which
        // schedules its boot ahead of the application providers despite the
        // ordering in config/app.php. Setting it here runs in the registration
        // phase, which completes before any provider's boot() — guaranteeing
        // the flag is false by the time Passport's routes/web.php is loaded.
        Passport::$deviceCodeGrantEnabled = false;
    }

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
