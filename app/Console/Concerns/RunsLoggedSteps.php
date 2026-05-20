<?php

namespace App\Console\Concerns;

use function Safe\exec;
use Illuminate\Console\Application;

/**
 * Helpers for console commands that want to print a "step" banner before
 * delegating to either a shell command or another artisan command.
 *
 * Expects the consuming class to be an `Illuminate\Console\Command` (so that
 * `info()`, `line()`, and `callSilent()` are available).
 */
trait RunsLoggedSteps
{
    public function runExec(string $message, string $command): void
    {
        $this->info($message);
        $this->line($command);
        exec($command, $output);
        $this->line(implode('\n', $output));
        $this->line('');
    }

    /**
     * @param  array<array-key, mixed>  $arguments
     */
    public function runArtisan(string $message, string $command, array $arguments = []): void
    {
        $this->info($message);
        $this->line(Application::formatCommandString($command));
        $this->callSilent($command, $arguments);
        $this->line('');
    }
}
