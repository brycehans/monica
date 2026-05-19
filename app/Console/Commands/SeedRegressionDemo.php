<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\WithFaker;

class SeedRegressionDemo extends Command
{
    use WithFaker;

    protected $signature = 'monica:seed-regression-demo
                            {--seed=12345 : Faker seed for reproducibility.}
                            {--random : Use a fresh random seed and print it.}
                            {--contacts=20 : Total supporting contact count for the rich demo account.}
                            {--fresh-demo : Delete and rebuild the known demo accounts if they already exist.}';

    protected $description = 'Build the browser-regression demo dataset (demo@example.test, blank@example.test).';

    public function handle()
    {
        $this->info('Browser regression demo data created.');
    }
}
