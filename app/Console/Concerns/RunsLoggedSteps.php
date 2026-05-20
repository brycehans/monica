<?php

namespace App\Console\Concerns;

use App\Console\Commands\Helpers\Command;

/**
 * Helpers for console commands that want to print a "step" banner before
 * delegating to either a shell command or another artisan command.
 *
 * Routes through `App\Console\Commands\Helpers\Command` so tests can swap in
 * `Command::fake()` and intercept the calls instead of actually executing
 * them — running `composer install --no-dev` for real mid-phpunit would
 * delete the dev dependencies the test suite is running under (#612).
 *
 * Expects the consuming class to be an `Illuminate\Console\Command`.
 */
trait RunsLoggedSteps
{
    public function runExec(string $message, string $command): void
    {
        Command::exec($this, $message, $command);
    }

    /**
     * @param  array<array-key, mixed>  $arguments
     */
    public function runArtisan(string $message, string $command, array $arguments = []): void
    {
        Command::artisan($this, $message, $command, $arguments);
    }
}
