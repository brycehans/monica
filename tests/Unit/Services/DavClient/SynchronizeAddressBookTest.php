<?php

namespace Tests\Unit\Services\DavClient;

use Tests\TestCase;
use Mockery\MockInterface;
use App\Models\Account\AddressBookSubscription;
use App\Services\DavClient\SynchronizeAddressBook;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\DavClient\Utils\AddressBookSynchronizer;

class SynchronizeAddressBookTest extends TestCase
{
    use DatabaseTransactions;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_runs_sync()
    {
        $this->mock(AddressBookSynchronizer::class, function (MockInterface $mock) {
            $mock->shouldReceive('execute')
                ->once()
                ->withArgs(function ($sync, $force) {
                    $this->assertFalse($force);

                    return true;
                });
        });

        $subscription = AddressBookSubscription::factory()->create();

        $request = [
            'account_id' => $subscription->account_id,
            'addressbook_subscription_id' => $subscription->id,
        ];

        (new SynchronizeAddressBook())->execute($request);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_runs_sync_force()
    {
        $this->mock(AddressBookSynchronizer::class, function (MockInterface $mock) {
            $mock->shouldReceive('execute')
                ->once()
                ->withArgs(function ($sync, $force) {
                    $this->assertTrue($force);

                    return true;
                });
        });

        $subscription = AddressBookSubscription::factory()->create();

        $request = [
            'account_id' => $subscription->account_id,
            'addressbook_subscription_id' => $subscription->id,
            'force' => true,
        ];

        (new SynchronizeAddressBook())->execute($request);
    }
}
