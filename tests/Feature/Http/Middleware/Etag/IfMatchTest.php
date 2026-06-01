<?php

namespace Tests\Feature\Http\Middleware\Etag;

use App\Http\Middleware\Etag\EtagConditionals;
use App\Http\Middleware\Etag\IfMatch;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class IfMatchTest extends TestCase
{
    private string $body = 'OK';

    protected function setUp(): void
    {
        parent::setUp();

        EtagConditionals::etagGenerateUsing(null);

        Route::middleware(IfMatch::class)->any('/_test/if-match', fn () => response($this->body, 200));
    }

    protected function tearDown(): void
    {
        EtagConditionals::etagGenerateUsing(null);

        parent::tearDown();
    }

    #[Test]
    public function it_returns_200_when_if_match_matches()
    {
        $this->withHeaders(['If-Match' => '"'.md5($this->body).'"'])
            ->patch('/_test/if-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_returns_200_when_if_match_matches_one_value_in_a_list()
    {
        $list = '"'.md5('first').'", "'.md5($this->body).'","'.md5('last').'"';

        $this->withHeaders(['If-Match' => $list])
            ->patch('/_test/if-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_returns_200_when_if_match_wildcard_is_present()
    {
        $list = '"'.md5('first').'", "*","'.md5('last').'"';

        $this->withHeaders(['If-Match' => $list])
            ->patch('/_test/if-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_returns_412_when_no_if_match_value_matches()
    {
        $this->withHeaders(['If-Match' => '"'.md5($this->body.'mismatch').'"'])
            ->patch('/_test/if-match')
            ->assertStatus(412);
    }

    #[Test]
    public function it_returns_412_when_none_in_a_list_matches()
    {
        $list = '"'.md5('first').'", "'.md5($this->body.'mismatch').'","'.md5('last').'"';

        $this->withHeaders(['If-Match' => $list])
            ->patch('/_test/if-match')
            ->assertStatus(412);
    }

    #[Test]
    public function it_returns_200_when_if_match_carries_a_weak_tag()
    {
        $this->withHeaders(['If-Match' => 'W/"'.md5($this->body).'"'])
            ->patch('/_test/if-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_passes_through_non_patch_requests_untouched()
    {
        $this->withHeaders(['If-Match' => '"never-checked"'])
            ->get('/_test/if-match')
            ->assertStatus(200);
    }

    #[Test]
    public function it_resolves_through_the_kernel_alias()
    {
        // Verify the 'ifMatch' string alias in app/Http/Kernel.php's
        // $routeMiddleware resolves to the in-tree class. Other middleware
        // tests register the class directly, which sidesteps alias lookup.
        Route::middleware('ifMatch')->any('/_test/if-match-alias', fn () => response($this->body, 200));

        $this->withHeaders(['If-Match' => '"'.md5($this->body).'"'])
            ->patch('/_test/if-match-alias')
            ->assertStatus(200);

        $this->withHeaders(['If-Match' => '"'.md5($this->body.'mismatch').'"'])
            ->patch('/_test/if-match-alias')
            ->assertStatus(412);
    }
}
