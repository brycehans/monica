<?php

namespace Tests\Commands\Tests;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\User\User;
use App\Models\Account\Account;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SetupFrontEndTestUserTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_create_a_test_user()
    {
        $accountCount = Account::count();
        $userCount = User::count();

        $this->artisan('setup:frontendtestuser')->run();

        $this->assertEquals($accountCount + 1, Account::count());
        $this->assertEquals($userCount + 1, User::count());
    }
}
