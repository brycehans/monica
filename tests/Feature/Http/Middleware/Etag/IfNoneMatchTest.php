<?php

namespace Tests\Feature\Http\Middleware\Etag;

use App\Http\Middleware\Etag\EtagConditionals;
use App\Http\Middleware\Etag\IfNoneMatch;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class IfNoneMatchTest extends TestCase
{
    private string $body = 'OK';

    protected function setUp(): void
    {
        parent::setUp();

        EtagConditionals::etagGenerateUsing(null);

        Route::middleware(IfNoneMatch::class)->any('/_test/if-none-match', fn () => response($this->body, 200));
    }

    protected function tearDown(): void
    {
        EtagConditionals::etagGenerateUsing(null);

        parent::tearDown();
    }

    #[Test]
    public function it_returns_200_when_if_none_match_does_not_match()
    {
        $this->withHeaders(['If-None-Match' => '"'.md5($this->body.'mismatch').'"'])
            ->get('/_test/if-none-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_returns_304_when_if_none_match_matches()
    {
        $this->withHeaders(['If-None-Match' => '"'.md5($this->body).'"'])
            ->get('/_test/if-none-match')
            ->assertStatus(304);
    }

    #[Test]
    public function it_returns_304_when_if_none_match_carries_a_weak_tag()
    {
        $this->withHeaders(['If-None-Match' => 'W/"'.md5($this->body).'"'])
            ->get('/_test/if-none-match')
            ->assertStatus(304);
    }

    #[Test]
    public function it_returns_304_for_head_with_matching_if_none_match()
    {
        // Pin the ETag via the callback so we are not at the mercy of whatever
        // body content the HEAD path leaves intact for the default md5 hash.
        EtagConditionals::etagGenerateUsing(fn () => 'fixed-etag');

        $server = $this->transformHeadersToServerVars(['If-None-Match' => '"fixed-etag"']);

        $this->call('HEAD', '/_test/if-none-match', [], [], [], $server)
            ->assertStatus(304);
    }
}
