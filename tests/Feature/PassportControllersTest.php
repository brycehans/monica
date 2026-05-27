<?php

namespace Tests\Feature;

use App\Models\User\User;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Tests\FeatureTestCase;

/**
 * Coverage for the in-tree replacements of the legacy Passport::routes()
 * management endpoints (#703). The OAuth server is unaffected; these tests
 * lock down the shape of the four endpoints the /settings/api Vue surface
 * consumes:
 *
 *   - /oauth/personal-access-tokens (index, store, destroy)
 *   - /oauth/clients                 (index, store, update, destroy)
 *   - /oauth/tokens                  (index, destroy) — 3rd-party authorized
 *   - /oauth/scopes                  (index)
 *
 * The most important contract here is that ClientController@store returns
 * the plain client secret in the response — Passport v13 hashes it at
 * insertion and the Vue (Clients.vue) shows it once in a modal after create.
 */
class PassportControllersTest extends FeatureTestCase
{
    use WithFaker;

    /**
     * Seed a personal-access client so $user->createToken(...) works inside
     * tests. The factory side of Passport (PersonalAccessTokenFactory)
     * resolves the personal access client by looking for an oauth_clients
     * row with grant_types containing 'personal_access'. We create one
     * per test for isolation.
     */
    private function ensurePersonalAccessClient(): Client
    {
        return app(ClientRepository::class)->createPersonalAccessGrantClient('Test Personal Access Client');
    }

    // -------------------------------------------------------------------------
    // PersonalAccessTokenController
    // -------------------------------------------------------------------------

    public function test_personal_access_tokens_index_returns_only_personal_tokens_for_the_user(): void
    {
        $this->ensurePersonalAccessClient();
        $user = $this->signIn();

        $user->createToken('alpha');
        $user->createToken('beta');

        $response = $this->getJson('/oauth/personal-access-tokens');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(2, $data);
        $names = collect($data)->pluck('name')->all();
        sort($names);
        $this->assertSame(['alpha', 'beta'], $names);
    }

    public function test_personal_access_tokens_index_isolates_users(): void
    {
        $this->ensurePersonalAccessClient();

        $other = factory(User::class)->create();
        $other->createToken('other-user-token');

        $user = $this->signIn();
        $user->createToken('mine');

        $response = $this->getJson('/oauth/personal-access-tokens');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertSame('mine', $data[0]['name']);
    }

    public function test_personal_access_tokens_store_returns_token_and_access_token(): void
    {
        // v13's PersonalAccessTokenResult::toArray() doesn't include the
        // `token` model — only camelCase primitives. The controller reshapes
        // to {token, accessToken} so the legacy Vue (which pushes
        // response.data.token into its in-memory list) keeps working.
        $this->ensurePersonalAccessClient();
        $this->signIn();

        $response = $this->postJson('/oauth/personal-access-tokens', [
            'name' => 'my-token',
            'scopes' => [],
        ]);

        $response->assertStatus(200);
        $body = $response->json();
        $this->assertArrayHasKey('token', $body);
        $this->assertArrayHasKey('accessToken', $body);
        $this->assertSame('my-token', $body['token']['name']);
        $this->assertIsString($body['accessToken']);
        $this->assertGreaterThan(100, strlen($body['accessToken']), 'accessToken should be a JWT-sized string');
    }

    public function test_personal_access_tokens_store_validates_name(): void
    {
        $this->ensurePersonalAccessClient();
        $this->signIn();

        $response = $this->postJson('/oauth/personal-access-tokens', ['name' => '']);

        $response->assertStatus(422);
    }

    public function test_personal_access_tokens_destroy_revokes_the_token(): void
    {
        $this->ensurePersonalAccessClient();
        $user = $this->signIn();

        $result = $user->createToken('to-revoke');
        $tokenId = $result->getToken()->id;

        $response = $this->deleteJson('/oauth/personal-access-tokens/'.$tokenId);

        $response->assertStatus(204);
        $this->assertTrue(Token::find($tokenId)->revoked);
    }

    public function test_personal_access_tokens_destroy_other_users_token_returns_404(): void
    {
        $this->ensurePersonalAccessClient();

        $other = factory(User::class)->create();
        $otherResult = $other->createToken('not-yours');
        $otherTokenId = $otherResult->getToken()->id;

        $this->signIn();

        $response = $this->deleteJson('/oauth/personal-access-tokens/'.$otherTokenId);

        $response->assertStatus(404);
        $this->assertFalse(Token::find($otherTokenId)->revoked);
    }

    // -------------------------------------------------------------------------
    // ClientController
    // -------------------------------------------------------------------------

    public function test_oauth_clients_index_returns_only_users_own_clients(): void
    {
        $user = $this->signIn();
        $other = factory(User::class)->create();

        app(ClientRepository::class)->createAuthorizationCodeGrantClient('mine', ['https://a.test/cb'], true, $user);
        app(ClientRepository::class)->createAuthorizationCodeGrantClient('theirs', ['https://b.test/cb'], true, $other);

        $response = $this->getJson('/oauth/clients');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertSame('mine', $data[0]['name']);
    }

    public function test_oauth_clients_store_returns_plain_secret_in_response(): void
    {
        // This is the contract that #703's UI fix hangs on: the create
        // response carries the plain secret so the Vue can surface it in a
        // one-shot modal. Passport v13 hashes the persisted secret, so the
        // plain value never appears again — index/update returns null/empty.
        $this->signIn();

        $response = $this->postJson('/oauth/clients', [
            'name' => 'new-client',
            'redirect' => 'https://example.com/cb',
        ]);

        $response->assertStatus(200);
        $body = $response->json();
        $this->assertSame('new-client', $body['name']);
        $this->assertSame('https://example.com/cb', $body['redirect']);
        $this->assertNotNull($body['secret']);
        $this->assertGreaterThanOrEqual(40, strlen($body['secret']), 'plain secret should be ~40 chars');
    }

    public function test_oauth_clients_store_persists_hashed_secret(): void
    {
        // Defence-in-depth: even though the controller returns the plain
        // secret in the response, the persisted column MUST be hashed in v13.
        // If a future change disables hashing, this test catches the regression.
        $this->signIn();

        $response = $this->postJson('/oauth/clients', [
            'name' => 'hash-check',
            'redirect' => 'https://example.com/cb',
        ]);

        $response->assertStatus(200);
        $plainSecret = $response->json('secret');
        $clientId = $response->json('id');

        $persisted = Client::find($clientId);
        $this->assertNotNull($persisted);

        $persistedSecret = $persisted->getAttributes()['secret'];
        $this->assertNotSame($plainSecret, $persistedSecret, 'persisted secret should not equal plain secret');
        $this->assertTrue(\Hash::check($plainSecret, $persistedSecret), 'persisted secret should be a hash of the plain secret');
    }

    public function test_oauth_clients_store_validates_name_and_redirect(): void
    {
        $this->signIn();

        $this->postJson('/oauth/clients', ['name' => '', 'redirect' => 'https://x.test/cb'])
            ->assertStatus(422);

        $this->postJson('/oauth/clients', ['name' => 'ok', 'redirect' => 'not-a-url'])
            ->assertStatus(422);
    }

    public function test_oauth_clients_update_changes_name_and_redirect(): void
    {
        $user = $this->signIn();
        $client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
            'before-name', ['https://before.test/cb'], true, $user
        );

        $response = $this->putJson('/oauth/clients/'.$client->id, [
            'name' => 'after-name',
            'redirect' => 'https://after.test/cb',
        ]);

        $response->assertStatus(200);
        $body = $response->json();
        $this->assertSame('after-name', $body['name']);
        $this->assertSame('https://after.test/cb', $body['redirect']);
    }

    public function test_oauth_clients_update_other_users_client_returns_404(): void
    {
        $other = factory(User::class)->create();
        $client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
            'theirs', ['https://x.test/cb'], true, $other
        );

        $this->signIn();

        $response = $this->putJson('/oauth/clients/'.$client->id, [
            'name' => 'hacked',
            'redirect' => 'https://attacker.test/cb',
        ]);

        $response->assertStatus(404);
        $this->assertSame('theirs', $client->fresh()->name);
    }

    public function test_oauth_clients_destroy_marks_client_revoked(): void
    {
        $user = $this->signIn();
        $client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
            'to-revoke', ['https://x.test/cb'], true, $user
        );

        $response = $this->deleteJson('/oauth/clients/'.$client->id);

        $response->assertStatus(204);
        $this->assertTrue($client->fresh()->revoked);
    }

    public function test_oauth_clients_destroy_other_users_client_returns_404(): void
    {
        $other = factory(User::class)->create();
        $client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
            'theirs', ['https://x.test/cb'], true, $other
        );

        $this->signIn();

        $response = $this->deleteJson('/oauth/clients/'.$client->id);

        $response->assertStatus(404);
        $this->assertFalse($client->fresh()->revoked);
    }

    // -------------------------------------------------------------------------
    // AuthorizedAccessTokenController
    // -------------------------------------------------------------------------

    public function test_authorized_tokens_index_returns_empty_for_fresh_user(): void
    {
        $this->signIn();

        $response = $this->getJson('/oauth/tokens');

        $response->assertStatus(200);
        $response->assertJson([]);
    }

    public function test_authorized_tokens_index_filters_personal_access_tokens(): void
    {
        // Authorized-tokens lists 3rd-party-issued tokens only; personal
        // access tokens belong to the other endpoint. Verify the filter
        // by issuing a PAT and confirming it doesn't appear here.
        $this->ensurePersonalAccessClient();
        $user = $this->signIn();
        $user->createToken('a-personal-token');

        $response = $this->getJson('/oauth/tokens');

        $response->assertStatus(200);
        $response->assertJson([]);
    }

    // -------------------------------------------------------------------------
    // ScopeController
    // -------------------------------------------------------------------------

    public function test_scopes_index_returns_passport_scopes(): void
    {
        $this->signIn();

        // Stash any existing scopes, register a known scope, then restore.
        $existing = Passport::scopes();
        Passport::tokensCan(['read-contacts' => 'Read your contacts']);

        try {
            $response = $this->getJson('/oauth/scopes');

            $response->assertStatus(200);
            $data = $response->json();
            $ids = collect($data)->pluck('id')->all();
            $this->assertContains('read-contacts', $ids);
        } finally {
            Passport::tokensCan($existing->mapWithKeys(fn ($scope) => [$scope->id => $scope->description])->all());
        }
    }

    // -------------------------------------------------------------------------
    // Auth boundary
    // -------------------------------------------------------------------------

    public function test_endpoints_require_authentication(): void
    {
        $this->getJson('/oauth/personal-access-tokens')->assertStatus(401);
        $this->getJson('/oauth/clients')->assertStatus(401);
        $this->getJson('/oauth/tokens')->assertStatus(401);
        $this->getJson('/oauth/scopes')->assertStatus(401);
    }
}
