<?php

namespace Tests\Commands\Tests;

use Tests\TestCase;
use App\Models\User\User;
use App\Models\Account\Account;
use App\Models\Account\Activity;
use App\Models\Contact\Address;
use App\Models\Contact\Call;
use App\Models\Contact\Contact;
use App\Models\Contact\ContactField;
use App\Models\Contact\Conversation;
use App\Models\Contact\Gift;
use App\Models\Contact\Message;
use App\Models\Contact\Note;
use App\Models\Contact\Pet;
use App\Models\Contact\Reminder;
use App\Models\Contact\Tag;
use App\Models\Contact\Task;
use App\Models\Journal\Day;
use App\Models\Journal\Entry;
use App\Models\Journal\JournalEntry;
use App\Models\Relationship\Relationship;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SeedRegressionDemoTest extends TestCase
{
    use DatabaseTransactions;

    /** @test */
    public function it_creates_a_browser_regression_demo_dataset()
    {
        $this->artisan('monica:seed-regression-demo', ['--seed' => 12345])
            ->expectsOutput('Browser regression demo data created.')
            ->run();

        $demoUser = User::where('email', 'test@example.com')->first();
        $blankUser = User::where('email', 'blank@example.com')->first();

        $this->assertNotNull($demoUser);
        $this->assertNotNull($blankUser);
        $this->assertTrue(Hash::check('password', $demoUser->password));
        $this->assertTrue(Hash::check('password', $blankUser->password));

        $demoAccount = Account::find($demoUser->account_id);
        $blankAccount = Account::find($blankUser->account_id);

        $this->assertGreaterThanOrEqual(12, Contact::where('account_id', $demoAccount->id)->count());
        $this->assertSame(0, Contact::where('account_id', $blankAccount->id)->count());

        $this->assertDatabaseHas('contacts', [
            'account_id' => $demoAccount->id,
            'first_name' => 'Demo Partial',
            'is_partial' => true,
        ]);
        $this->assertDatabaseHas('contacts', [
            'account_id' => $demoAccount->id,
            'first_name' => 'Demo Archived',
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('contacts', [
            'account_id' => $demoAccount->id,
            'first_name' => 'Demo Deceased',
            'is_dead' => true,
        ]);
        $this->assertDatabaseHas('contacts', [
            'account_id' => $demoAccount->id,
            'first_name' => 'Élodie',
        ]);

        $this->assertGreaterThan(0, Note::where('account_id', $demoAccount->id)->favorited()->count());
        $this->assertGreaterThan(0, Call::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, ContactField::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, Conversation::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, Message::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, Reminder::where('account_id', $demoAccount->id)->where('frequency_type', 'year')->count());
        $this->assertGreaterThanOrEqual(12, Task::where('account_id', $demoAccount->id)->inProgress()->count());
        $this->assertGreaterThan(0, Task::where('account_id', $demoAccount->id)->completed()->count());
        $this->assertGreaterThanOrEqual(
            6,
            Task::where('account_id', $demoAccount->id)->whereNull('contact_id')->count()
        );
        $this->assertGreaterThan(0, Gift::where('account_id', $demoAccount->id)->isIdea()->count());
        $this->assertGreaterThan(0, Gift::where('account_id', $demoAccount->id)->offered()->count());
        $this->assertGreaterThan(0, Activity::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, Pet::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThan(0, Relationship::where('account_id', $demoAccount->id)->count());

        // Addresses tranche
        $this->assertGreaterThanOrEqual(8, Address::where('account_id', $demoAccount->id)->count());
        $this->assertDatabaseHas('places', [
            'account_id' => $demoAccount->id,
            'country' => 'US',
        ]);
        $this->assertTrue(
            Address::where('account_id', $demoAccount->id)->whereNotNull('name')->exists(),
            'At least one address should carry a label name (Home/Work).'
        );

        // Tags tranche
        $this->assertDatabaseHas('tags', [
            'account_id' => $demoAccount->id,
            'name' => 'family',
        ]);
        $this->assertSame(5, Tag::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThanOrEqual(
            12,
            DB::table('contact_tag')->where('account_id', $demoAccount->id)->count()
        );

        // Reminders tranche
        $this->assertGreaterThanOrEqual(8, Reminder::where('account_id', $demoAccount->id)->count());
        $this->assertTrue(
            Reminder::where('account_id', $demoAccount->id)->where('frequency_type', 'week')->exists(),
            'A weekly recurring reminder should exist.'
        );
        $this->assertTrue(
            Reminder::where('account_id', $demoAccount->id)->where('frequency_type', 'month')->exists(),
            'A monthly recurring reminder should exist.'
        );
        $this->assertGreaterThanOrEqual(
            3,
            DB::table('reminders_sent')->where('account_id', $demoAccount->id)->count()
        );

        // Journal tranche
        $this->assertGreaterThanOrEqual(12, Entry::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThanOrEqual(30, Day::where('account_id', $demoAccount->id)->count());
        $this->assertGreaterThanOrEqual(42, JournalEntry::where('account_id', $demoAccount->id)->count());
    }
}
