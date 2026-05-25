<?php

namespace Tests\Commands\Tests;

use Tests\TestCase;
use App\Console\Commands\Helpers\Command;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SetupTestCommandTest extends TestCase
{
    use DatabaseTransactions;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_completes_non_interactively_with_skip_seed()
    {
        /** @var \Tests\Helpers\CommandCallerFake */
        $fake = Command::fake();

        $this->artisan('setup:test', [
            '--skipSeed' => true,
            '--no-interaction' => true,
        ])->assertSuccessful()->run();

        $fake->assertContainsMessage('✓ Performing migrations');
        $fake->assertContainsMessage('✓ Symlink the storage folder');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_contacts_option_to_set_seed_count()
    {
        /** @var \Tests\Helpers\CommandCallerFake */
        $fake = Command::fake();

        $this->artisan('setup:test', [
            '--skipSeed' => true,
            '--contacts' => 5,
            '--no-interaction' => true,
        ])->assertSuccessful()->run();

        $fake->assertContainsMessage('✓ Performing migrations');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_prompts_for_confirmation_when_interactive()
    {
        /** @var \Tests\Helpers\CommandCallerFake */
        $fake = Command::fake();

        $this->artisan('setup:test', ['--skipSeed' => true])
            ->expectsConfirmation(
                'Are you sure you want to proceed? This will delete ALL data in your environment.',
                'yes'
            )
            ->assertSuccessful()
            ->run();

        $fake->assertContainsMessage('✓ Performing migrations');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_user_declines_confirmation()
    {
        /** @var \Tests\Helpers\CommandCallerFake */
        $fake = Command::fake();

        $this->artisan('setup:test', ['--skipSeed' => true])
            ->expectsConfirmation(
                'Are you sure you want to proceed? This will delete ALL data in your environment.',
                'no'
            )
            ->assertFailed()
            ->run();

        $this->assertCount(0, $fake->buffer);
    }
}
