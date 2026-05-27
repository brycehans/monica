<?php

namespace App\Http\Controllers\Passport;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Passport\Token;
use Laravel\Passport\TokenRepository;

/**
 * Re-implements the legacy /oauth/tokens endpoints that Passport v11+ removed.
 * Lists tokens issued to third-party clients only — first-party and personal
 * access tokens are filtered out (the latter live on /oauth/personal-access-
 * tokens). See #703.
 */
class AuthorizedAccessTokenController extends Controller
{
    public function __construct(
        protected TokenRepository $tokenRepository,
    ) {
    }

    public function forUser(Request $request): Collection
    {
        return $this->tokenRepository->forUser($request->user())
            ->load('client')
            ->reject(fn (Token $token): bool => $token->client->revoked || $token->client->firstParty())
            ->values();
    }

    public function destroy(Request $request, string $tokenId): Response
    {
        $token = $this->tokenRepository->findForUser($tokenId, $request->user());

        if (is_null($token)) {
            return new Response('', 404);
        }

        $token->revoke();
        $token->refreshToken?->revoke();

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
