<?php

namespace App\Http\Controllers\Passport;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Http\Rules\RedirectRule;

/**
 * Re-implements the legacy /oauth/clients endpoints that Passport v11+ removed
 * alongside the Passport::routes() macro. See #703.
 *
 * v13 stores secrets hashed and redirect URIs as an array; the legacy Vue
 * (Clients.vue) was written against unhashed secrets and a single `redirect`
 * URL. transform() reshapes responses so the existing UI keeps working without
 * pulling its v2 components into this PR. Newly-created clients still surface
 * their plain secret in the create response; existing clients return secret
 * null (it's not recoverable from a hashed column).
 */
class ClientController extends Controller
{
    public function __construct(
        protected ClientRepository $clients,
        protected RedirectRule $redirectRule,
    ) {
    }

    public function forUser(Request $request): array
    {
        return $this->ownedClients($request)
            ->orderBy('name')
            ->get()
            ->map(fn (Client $client): array => $this->transform($client))
            ->all();
    }

    public function store(Request $request): array
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'redirect' => ['required', $this->redirectRule],
        ]);

        $client = $this->clients->createAuthorizationCodeGrantClient(
            $request->name,
            [$request->redirect],
            true,
            $request->user(),
        );

        return $this->transform($client);
    }

    public function update(Request $request, string $clientId): Response|array
    {
        $client = $this->ownedClients($request)->find($clientId);

        if (! $client) {
            return new Response('', 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'redirect' => ['required', $this->redirectRule],
        ]);

        $this->clients->update($client, $request->name, [$request->redirect]);

        return $this->transform($client->fresh());
    }

    public function destroy(Request $request, string $clientId): Response
    {
        $client = $this->ownedClients($request)->find($clientId);

        if (! $client) {
            return new Response('', 404);
        }

        $this->clients->delete($client);

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /**
     * Lookup the owned clients via the polymorphic owner_id/owner_type schema
     * introduced by Passport v13. Bypasses ClientRepository::forUser/findForUser
     * which still query the dropped `user_id` column (see the v13 fork migration
     * 2026_05_26_000001_upgrade_oauth_clients_for_passport_13).
     */
    private function ownedClients(Request $request)
    {
        return $request->user()->oauthApps()->where('revoked', false);
    }

    private function transform(Client $client): array
    {
        // Access via getAttribute() / public property rather than the magic
        // snake_case names — Passport defines them as Attribute accessor
        // methods which phpstan can't see through.
        $redirectUris = $client->getAttribute('redirect_uris') ?? [];

        return [
            'id' => $client->getKey(),
            'name' => $client->name,
            'redirect' => $redirectUris[0] ?? '',
            'secret' => $client->plainSecret,
            'revoked' => $client->revoked,
        ];
    }
}
