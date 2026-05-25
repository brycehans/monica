<?php

namespace Tests\Commands\Other;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class WaitForDbTest extends TestCase
{
    use DatabaseTransactions;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_runs_wait_for_db_command()
    {
        $this->artisan('waitfordb')
            ->expectsOutput('Database ready.')
            ->assertExitCode(0);
    }
}
