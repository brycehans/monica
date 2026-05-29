<?php

namespace App\Console\Commands;

use App\Models\Account\Account;
use Illuminate\Console\Command;

class SetPremiumAccount extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'account:setpremium {accountId} {--revoke}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Grant (default) or revoke (--revoke) free premium access on an account.';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle(): void
    {
        $account = Account::findOrFail($this->argument('accountId'));
        $account->has_access_to_paid_version_for_free = ! $this->option('revoke');
        $account->save();
    }
}
