<?php

namespace Tests\Commands\Scheduling;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class CalculateStatisticsTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function the_command_runs_well()
    {
        $runsWell = true;

        try {
            $this->artisan('monica:calculatestatistics')->run();
        } catch (QueryException $e) {
            $runsWell = false;
        }

        $this->assertTrue($runsWell);
    }
}
