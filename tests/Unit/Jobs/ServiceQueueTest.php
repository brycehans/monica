<?php

namespace Tests\Unit\Jobs;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class ServiceQueueTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_run_a_service_ok(): void
    {
        config(['queue.default' => 'sync']);

        ServiceQueueTester::dispatch();

        $this->assertTrue(ServiceQueueTester::$executed);
        $this->assertFalse(ServiceQueueTester::$failed);
    }

    #[Test]
    public function it_run_a_service_sync(): void
    {
        ServiceQueueTester::dispatchSync();

        $this->assertTrue(ServiceQueueTester::$executed);
        $this->assertFalse(ServiceQueueTester::$failed);
    }

    #[Test]
    public function it_run_a_service_which_failed(): void
    {
        $this->expectException(\Exception::class);
        try {
            ServiceQueueTester::dispatchSync(['throw' => true]);
        } finally {
            $this->assertTrue(ServiceQueueTester::$executed);
            $this->assertTrue(ServiceQueueTester::$failed);
        }
    }

    #[Test]
    public function service_is_not_run_if_queue_set(): void
    {
        config(['queue.default' => 'database']);

        ServiceQueueTester::dispatch(['throw' => true]);

        $this->assertFalse(ServiceQueueTester::$executed);
        $this->assertFalse(ServiceQueueTester::$failed);
    }
}
