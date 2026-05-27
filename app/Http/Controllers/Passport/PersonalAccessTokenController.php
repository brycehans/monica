<?php

namespace App\Http\Controllers\Passport;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Laravel\Passport\TokenRepository;

/**
 * Re-implements the legacy /oauth/personal-access-tokens endpoints that
 * Passport v11+ removed alongside the Passport::routes() macro. The Vue
 * components under resources/js/components/passport/ still expect this
 * surface; see #703 for the wider context.
 */
class PersonalAccessTokenController extends Controller
{
    public function __construct(
        protected TokenRepository $tokenRepository,
    ) {
    }

    public function forUser(Request $request): Collection
    {
        return $this->tokenRepository->forUser($request->user())
            ->filter(fn (Token $token): bool => ! $token->client->revoked && $token->client->hasGrantType('personal_access'))
            ->values();
    }

    public function store(Request $request): array
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'scopes' => ['array', Rule::in(Passport::scopeIds())],
        ]);

        $result = $request->user()->createToken($request->name, $request->scopes ?: []);

        // Vue PersonalAccessTokens.vue expects {token, accessToken}. The v13
        // PersonalAccessTokenResult only serialises {accessTokenId, accessToken,
        // tokenType, expiresIn} via toArray(); the Token model is on the magic
        // ->token property. We reshape it here to keep the legacy contract.
        return [
            'token' => $result->getToken(),
            'accessToken' => $result->accessToken,
        ];
    }

    public function destroy(Request $request, string $tokenId): Response
    {
        $token = $this->tokenRepository->findForUser($tokenId, $request->user());

        if (is_null($token)) {
            return new Response('', 404);
        }

        $token->revoke();

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
