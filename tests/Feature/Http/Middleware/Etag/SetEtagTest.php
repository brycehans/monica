<?php

namespace Tests\Feature\Http\Middleware\Etag;

use App\Http\Middleware\Etag\EtagConditionals;
use App\Http\Middleware\Etag\SetEtag;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SetEtagTest extends TestCase
{
    private string $body = 'OK';

    protected function setUp(): void
    {
        parent::setUp();

        EtagConditionals::etagGenerateUsing(null);

        Route::middleware(SetEtag::class)->any('/_test/set-etag', fn () => $this->body);
    }

    protected function tearDown(): void
    {
        EtagConditionals::etagGenerateUsing(null);

        parent::tearDown();
    }

    #[Test]
    public function it_sets_etag_header_on_response()
    {
        $this->get('/_test/set-etag')->assertHeader('ETag', '"'.md5($this->body).'"');
    }

    #[Test]
    public function it_uses_registered_callback_when_present()
    {
        EtagConditionals::etagGenerateUsing(fn () => 'custom');

        $this->get('/_test/set-etag')->assertHeader('ETag', '"custom"');
    }

    #[Test]
    public function it_sets_etag_header_on_head_responses()
    {
        // The callback sees the rewritten GET method so it can key off
        // $request->getMethod() without HEAD producing a different ETag.
        EtagConditionals::etagGenerateUsing(fn ($request) => $request->getMethod().'-etag');

        $this->call('HEAD', '/_test/set-etag')->assertHeader('ETag', '"GET-etag"');
    }
}
