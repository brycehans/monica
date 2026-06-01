<?php

namespace App\Http\Middleware\Etag;

use Closure;
use Illuminate\Http\Request;

class IfNoneMatch
{
    public function handle(Request $request, Closure $next)
    {
        $method = $request->getMethod();

        if ($request->isMethod('HEAD')) {
            $request->setMethod('GET');
        }

        $response = $next($request);

        $etag = EtagConditionals::getEtag($request, $response);
        $noneMatch = array_map(
            static fn (string $tag): string => str_replace('W/', '', $tag),
            $request->getETags()
        );

        if (in_array($etag, $noneMatch, true)) {
            $response->setNotModified();
        }

        $request->setMethod($method);

        return $response;
    }
}
