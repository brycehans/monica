<?php

namespace Tests\Feature;

use App\Models\Contact\Contact;
use App\Models\Contact\Gender;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\FeatureTestCase;

/**
 * Smoke coverage for the request lifecycle on primary authenticated routes.
 *
 * Catches regressions that bypass model/unit tests but fire when the framework
 * hydrates a User from DB and runs a real request through middleware + Blade
 * — e.g. Laravel 11's stricter Encrypter rejecting `decrypt('')` from an
 * empty-string column default that L10 silently tolerated (PR #652, fix
 * commit d16d40283).
 *
 * Asserts no 500s and no Ignition error-page markers in the response body.
 *
 * Filed: #656.
 */
class SmokeRoutesTest extends FeatureTestCase
{
    private const ERROR_PAGE_MARKERS = [
        'The payload is invalid',
        'Whoops, looks like something went wrong',
        'Ignition\\',
        'Symfony\\Component\\HttpKernel\\Exception\\',
    ];

    public function test_guest_can_load_login_or_register_page(): void
    {
        $response = $this->followingRedirects()->get('/');

        $response->assertStatus(200);
        $this->assertNotAnErrorPage($response, '/');
    }

    public function test_authenticated_user_can_load_dashboard(): void
    {
        $this->signIn();

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $this->assertNotAnErrorPage($response, '/dashboard');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('authenticatedGetRoutes')]
    public function test_authenticated_user_can_load_route(string $url): void
    {
        $this->signIn();

        $response = $this->get($url);

        $this->assertSame(200, $response->getStatusCode(), "GET {$url} did not return 200");
        $this->assertNotAnErrorPage($response, $url);
    }

    public static function authenticatedGetRoutes(): array
    {
        return [
            'people index' => ['/people'],
            'people add form' => ['/people/add'],
            'settings' => ['/settings'],
            'journal' => ['/journal'],
        ];
    }

    public function test_authenticated_user_can_view_a_contact_detail_page(): void
    {
        $user = $this->signIn();
        $contact = factory(Contact::class)->create([
            'account_id' => $user->account_id,
        ]);

        $response = $this->get('/people/'.$contact->hashID());

        $response->assertStatus(200);
        $this->assertNotAnErrorPage($response, '/people/{contact}');
    }

    /**
     * Regression: PR #652 / commit d16d40283. Older installs end up with
     * `google2fa_secret = ''` (empty string) in the DB rather than NULL; the
     * Laravel 11 Encrypter rejects `decrypt('')` with DecryptException where
     * L10 silently returned null. The User accessor must short-circuit on
     * blank values without invoking the encrypter.
     */
    public function test_dashboard_loads_for_user_with_empty_google2fa_secret(): void
    {
        $user = $this->signIn();

        DB::table('users')
            ->where('id', $user->id)
            ->update(['google2fa_secret' => '']);
        $user->refresh();
        $this->be($user);

        $response = $this->get('/dashboard');

        $response->assertStatus(200);
        $this->assertNotAnErrorPage($response, '/dashboard (empty google2fa_secret)');
    }

    public function test_authenticated_user_can_create_a_contact(): void
    {
        $user = $this->signIn();
        $gender = factory(Gender::class)->create([
            'account_id' => $user->account_id,
        ]);

        $response = $this->post('/people', [
            'first_name' => 'Smoke',
            'last_name' => 'Test',
            'gender' => $gender->id,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('contacts', [
            'account_id' => $user->account_id,
            'first_name' => 'Smoke',
            'last_name' => 'Test',
        ]);
    }

    private function assertNotAnErrorPage(TestResponse $response, string $url): void
    {
        $body = (string) $response->getContent();

        foreach (self::ERROR_PAGE_MARKERS as $marker) {
            $this->assertStringNotContainsString(
                $marker,
                $body,
                "Route {$url} returned an error-page marker: {$marker}"
            );
        }
    }
}
