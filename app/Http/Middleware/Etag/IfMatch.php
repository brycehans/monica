<?php

namespace App\Http\Middleware\Etag;

use Closure;
use Illuminate\Http\Request;

class IfMatch
{
    public function handle(Request $request, Closure $next)
    {
        // Only PATCH carrying an If-Match header is conditional; everything
        // else passes through untouched.
        if (! ($request->isMethod('PATCH') && $request->hasHeader('If-Match'))) {
            return $next($request);
        }

        // Replay the same URI as a GET to compute the current ETag, then
        // compare it against the If-Match value(s).
        $getRequest = Request::create($request->getRequestUri(), 'GET');
        $getRequest->headers = $request->headers;
        $getRequest->headers->set('X-From-Middleware', 'IfMatch');
        $getResponse = app()->handle($getRequest);

        $currentEtag = EtagConditionals::getEtag($request, $getResponse);
        $ifMatch = $request->header('If-Match');

        if ($ifMatch === null) {
            return response(null, 412);
        }

        $candidates = array_map(
            static fn (string $tag): string => trim(str_replace('W/', '', $tag)),
            explode(',', $ifMatch)
        );

        if (! (in_array($currentEtag, $candidates, true) || in_array('"*"', $candidates, true))) {
            return response(null, 412);
        }

        // Restore the outer request for Laravel Octane.
        app()->instance('request', $request);

        return $next($request);
    }
}
