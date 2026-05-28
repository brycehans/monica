<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Laravel\Passport\Passport;
use Tests\FeatureTestCase;

/**
 * Verifies that the RFC 8628 device-authorization grant is suppressed.
 *
 * Passport 13 ships the device-code grant enabled by default and registers
 * /oauth/device, /oauth/device/code, and /oauth/device/authorize. Monica
 * doesn't use that flow (mobile/API clients use password + auth-code), and
 * the companion oauth_device_codes table was omitted from the migrations
 * published in #677. Until both sides land in lockstep, the safe state is
 * "grant off, routes absent".
 *
 * If this test fails, either the toggle in AuthServiceProvider has been
 * removed/regressed, or Passport's defaults have shifted in a way that
 * requires a different disable path. Don't paper over the failure by
 * deleting the test — re-confirm the schema (oauth_device_codes exists +
 * the DeviceCodeRepository round-trips) before re-enabling.
 */
class PassportDeviceCodeGrantDisabledTest extends FeatureTestCase
{
    public function test_device_code_grant_static_is_disabled(): void
    {
        $this->assertFalse(Passport::$deviceCodeGrantEnabled);
    }

    public function test_device_user_code_route_is_not_registered(): void
    {
        $this->assertFalse(Route::has('passport.device'));
        $this->assertFalse(Route::has('passport.device.code'));
        $this->assertFalse(Route::has('passport.device.authorizations.authorize'));
    }

    public function test_device_user_code_endpoint_returns_404(): void
    {
        $this->get('/oauth/device')->assertStatus(404);
    }

    public function test_device_code_token_endpoint_returns_404(): void
    {
        $this->postJson('/oauth/device/code')->assertStatus(404);
    }

    public function test_device_authorize_endpoint_returns_404_when_signed_in(): void
    {
        $this->signIn();

        $this->get('/oauth/device/authorize')->assertStatus(404);
    }
}
