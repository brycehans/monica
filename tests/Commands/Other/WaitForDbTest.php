<?php

namespace Tests\Commands\Other;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class WaitForDbTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_runs_wait_for_db_command()
    {
        $this->artisan('waitfordb')
            ->expectsOutput('Database ready.')
            ->assertExitCode(0);
    }
}
