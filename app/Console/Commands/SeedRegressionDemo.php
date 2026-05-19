<?php

namespace App\Console\Commands;

use App\Models\Account\Account;
use App\Models\User\User;
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

    protected $description = 'Build the browser-regression demo dataset (test@example.com, blank@example.com).';

    private Account $demoAccount;
    private Account $blankAccount;
    private User $demoUser;

    public function handle()
    {
        $seed = $this->resolveSeed();
        $this->setUpFaker();
        $this->faker->seed($seed);

        $this->buildDemoAccount();
        $this->buildBlankAccount();

        $this->info('Browser regression demo data created.');
        if ($this->option('random')) {
            $this->line("Random seed used: {$seed}");
        }
    }

    private function resolveSeed(): int
    {
        if ($this->option('random')) {
            return random_int(1, PHP_INT_MAX);
        }

        return (int) $this->option('seed');
    }

    private function buildDemoAccount(): void
    {
        $this->demoAccount = Account::createDefault('Demo', 'User', 'test@example.com', 'password');
        /** @var User $user */
        $user = $this->demoAccount->users()->first();
        $user->markEmailAsVerified();
        $this->demoUser = $user;
    }

    private function buildBlankAccount(): void
    {
        $this->blankAccount = Account::createDefault('Blank', 'State', 'blank@example.com', 'password');
        $this->blankAccount->users()->first()->markEmailAsVerified();
    }
}
