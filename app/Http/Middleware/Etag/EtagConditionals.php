<?php

namespace App\Http\Middleware\Etag;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * In-tree replacement for the static `Werk365\EtagConditionals\EtagConditionals`
 * helper. Holds the optional ETag-generation callback that the SetEtag /
 * IfMatch / IfNoneMatch middlewares consult. See docs/design-decisions.md
 * (section "ETag conditional middleware: replaced inline") for the why.
 */
class EtagConditionals
{
    /**
     * The callback used to generate the ETag.
     */
    protected static ?Closure $etagGenerateCallback = null;

    /**
     * Register a callback that should be used when generating the ETag for a
     * given request/response pair. Pass `null` to clear.
     */
    public static function etagGenerateUsing(?Closure $callback): void
    {
        static::$etagGenerateCallback = $callback;
    }

    /**
     * Return the ETag value for this request/response pair, always quoted.
     */
    public static function getEtag(Request $request, Response $response): string
    {
        $etag = static::$etagGenerateCallback !== null
            ? call_user_func(static::$etagGenerateCallback, $request, $response)
            : md5($response->getContent());

        return (string) Str::of($etag)->start('"')->finish('"');
    }
}
