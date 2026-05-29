<?php

namespace Tests\Commands\Other;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\Account\Account;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SetPremiumAccountTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_grants_paid_access_by_default()
    {
        $account = factory(Account::class)->create(['has_access_to_paid_version_for_free' => false]);

        $this->artisan('account:setpremium', ['accountId' => $account->id])->run();

        $this->assertTrue($account->fresh()->has_access_to_paid_version_for_free);
    }

    #[Test]
    public function it_revokes_paid_access_with_the_revoke_flag()
    {
        $account = factory(Account::class)->create(['has_access_to_paid_version_for_free' => true]);

        $this->artisan('account:setpremium', ['accountId' => $account->id, '--revoke' => true])->run();

        $this->assertFalse($account->fresh()->has_access_to_paid_version_for_free);
    }

    #[Test]
    public function it_fails_on_unknown_account()
    {
        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->artisan('account:setpremium', ['accountId' => 999999])->run();
    }
}
