<?php

namespace App\Http\Middleware\Etag;

use Closure;
use Illuminate\Http\Request;

class SetEtag
{
    public function handle(Request $request, Closure $next)
    {
        $method = $request->getMethod();

        // HEAD shares ETag with GET — flip during handling, restore after.
        if ($request->isMethod('HEAD')) {
            $request->setMethod('GET');
        }

        $response = $next($request);

        $response->setEtag(EtagConditionals::getEtag($request, $response));

        $request->setMethod($method);

        return $response;
    }
}
