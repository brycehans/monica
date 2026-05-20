<?php

namespace App\Console\Commands;

use App\Models\Account\Account;
use App\Models\Account\Photo;
use App\Models\Contact\Contact;
use App\Models\Contact\ContactFieldType;
use App\Models\Contact\Debt;
use App\Models\Contact\Document;
use App\Models\Contact\Reminder;
use App\Models\Contact\Task;
use App\Models\Journal\Day;
use App\Models\Journal\Entry;
use App\Models\Journal\JournalEntry;
use App\Models\User\User;
use App\Services\Account\Activity\Activity\CreateActivity;
use App\Services\Contact\Address\CreateAddress;
use App\Services\Contact\Contact\CreateContact;
use App\Services\Contact\LifeEvent\CreateLifeEvent;
use App\Services\Contact\Contact\UpdateBirthdayInformation;
use App\Services\Contact\Contact\UpdateContactFoodPreferences;
use App\Services\Contact\Contact\UpdateContactIntroduction;
use App\Services\Contact\Contact\UpdateDeceasedInformation;
use App\Services\Contact\Contact\UpdateWorkInformation;
use App\Services\Contact\Conversation\AddMessageToConversation;
use App\Services\Contact\Conversation\CreateConversation;
use App\Services\Account\Settings\DestroyAccount;
use App\Services\Contact\Gift\CreateGift;
use App\Services\Contact\Relationship\CreateRelationship;
use App\Services\Contact\Reminder\CreateReminder;
use App\Services\Contact\Tag\AssociateTag;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use function Safe\base64_decode;

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

    /** @var array<int, Contact> */
    private array $supportingContacts = [];

    public function handle(): int
    {
        if (! $this->prepareAccountsForSeeding()) {
            return self::FAILURE;
        }

        $seed = $this->resolveSeed();
        $this->setUpFaker();
        $this->faker->seed($seed);

        $this->buildDemoAccount();
        $this->buildEdgeCaseContacts();
        $this->buildSupportingContacts();
        $this->populateContactFields();
        $this->populateAddresses();
        $this->populateTags();
        $this->populateNotes();
        $this->populateCalls();
        $this->populateConversations();
        $this->populateActivities();
        $this->populateTasks();
        $this->populateGifts();
        $this->populatePets();
        $this->populateReminders();
        $this->populateJournal();
        $this->populateLifeEvents();
        $this->populateDebts();
        $this->populateFoodPreferences();
        $this->populateFirstMetInfo();
        $this->populateWorkInfo();
        $this->populateAttachments();
        $this->buildBlankAccount();

        $this->info('Browser regression demo data created.');
        if ($this->option('random')) {
            $this->line("Random seed used: {$seed}");
        }

        return self::SUCCESS;
    }

    private function prepareAccountsForSeeding(): bool
    {
        $existing = User::whereIn('email', ['test@example.com', 'blank@example.com'])->get();

        if ($existing->isEmpty()) {
            return true;
        }

        if (! $this->option('fresh-demo')) {
            $this->error('Demo accounts already exist. Re-run with --fresh-demo to rebuild them.');

            return false;
        }

        foreach ($existing as $user) {
            app(DestroyAccount::class)->execute([
                'account_id' => $user->account_id,
            ]);
        }

        return true;
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

    private function buildEdgeCaseContacts(): void
    {
        $accountId = $this->demoAccount->id;
        $authorId = $this->demoUser->id;

        // Partial contact — minimal record.
        app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Demo Partial',
            'is_partial' => true,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);

        // Archived contact — is_active flipped after creation (CreateContact doesn't accept it).
        $archived = app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Demo Archived',
            'last_name' => 'Person',
            'is_partial' => false,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);
        $archived->is_active = false;
        $archived->save();

        // Deceased contact — created, then UpdateDeceasedInformation flips is_dead.
        $deceased = app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Demo Deceased',
            'last_name' => 'Memory',
            'is_partial' => false,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);
        app(UpdateDeceasedInformation::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $deceased->id,
            'is_deceased' => true,
            'is_date_known' => true,
            'day' => 14,
            'month' => 3,
            'year' => 2020,
            'add_reminder' => false,
        ]);

        // Non-ASCII display name.
        app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Élodie',
            'last_name' => 'Dupré',
            'is_partial' => false,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);

        // Very long display name.
        app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Bartholomew-Maximilian',
            'last_name' => 'Featherstonehaugh-Worthington',
            'is_partial' => false,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);

        // Contact with upcoming birthday (≤ 30 days from "now").
        $upcoming = app(CreateContact::class)->execute([
            'account_id' => $accountId,
            'author_id' => $authorId,
            'first_name' => 'Sam',
            'last_name' => 'Upcoming-Birthday',
            'is_partial' => false,
            'is_birthdate_known' => false,
            'is_deceased' => false,
            'is_deceased_date_known' => false,
        ]);
        $soon = now()->addDays(7);
        app(UpdateBirthdayInformation::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $upcoming->id,
            'is_date_known' => true,
            'day' => (int) $soon->format('d'),
            'month' => (int) $soon->format('m'),
            'year' => (int) $soon->copy()->subYears(30)->format('Y'),
            'is_age_based' => false,
            'age' => 30,
            'add_reminder' => true,
            'is_deceased' => false,
        ]);
    }

    private function buildSupportingContacts(): void
    {
        $count = max((int) $this->option('contacts'), 12);
        $accountId = $this->demoAccount->id;
        $authorId = $this->demoUser->id;

        $scenarios = [
            ['first_name' => 'Avery', 'last_name' => 'Partner', 'role' => 'Significant other'],
            ['first_name' => 'Jordan', 'last_name' => 'Parent', 'role' => 'Parent'],
            ['first_name' => 'Casey', 'last_name' => 'Sibling', 'role' => 'Sibling'],
            ['first_name' => 'Morgan', 'last_name' => 'Friend', 'role' => 'Close friend'],
            ['first_name' => 'Robin', 'last_name' => 'Friend', 'role' => 'Close friend'],
            ['first_name' => 'Taylor', 'last_name' => 'Coworker', 'role' => 'Coworker'],
            ['first_name' => 'Riley', 'last_name' => 'Neighbor', 'role' => 'Neighbor'],
        ];

        foreach ($scenarios as $scenario) {
            $contact = app(CreateContact::class)->execute([
                'account_id' => $accountId,
                'author_id' => $authorId,
                'first_name' => $scenario['first_name'],
                'last_name' => $scenario['last_name'],
                'is_partial' => false,
                'is_birthdate_known' => false,
                'is_deceased' => false,
                'is_deceased_date_known' => false,
            ]);
            $this->supportingContacts[] = $contact;
        }

        // Filler contacts up to the requested count (already created edge + scenario contacts count toward this).
        $alreadyCreated = Contact::where('account_id', $accountId)->count();
        for ($i = $alreadyCreated; $i < $count; $i++) {
            $this->supportingContacts[] = app(CreateContact::class)->execute([
                'account_id' => $accountId,
                'author_id' => $authorId,
                'first_name' => $this->faker->firstName(),
                'last_name' => $this->faker->lastName(),
                'is_partial' => false,
                'is_birthdate_known' => false,
                'is_deceased' => false,
                'is_deceased_date_known' => false,
            ]);
        }

        // Pick a relationship type id (the account already has them via populateDefaultFields).
        $partner = $this->supportingContacts[0];
        $relationshipTypeId = $this->demoAccount->relationshipTypes->first()->id;

        foreach (array_slice($this->supportingContacts, 1, 6) as $relative) {
            app(CreateRelationship::class)->execute([
                'account_id' => $accountId,
                'contact_is' => $partner->id,
                'of_contact' => $relative->id,
                'relationship_type_id' => $relationshipTypeId,
            ]);
        }
    }

    private function populateContactFields(): void
    {
        $accountId = $this->demoAccount->id;
        $types = ContactFieldType::where('account_id', $accountId)->get()->keyBy('name');

        foreach ($this->supportingContacts as $contact) {
            if (isset($types['Email'])) {
                $contact->contactFields()->create([
                    'contact_field_type_id' => $types['Email']->id,
                    'data' => $this->faker->email(),
                    'account_id' => $accountId,
                ]);
            }
            if (isset($types['Phone'])) {
                $contact->contactFields()->create([
                    'contact_field_type_id' => $types['Phone']->id,
                    'data' => $this->faker->phoneNumber(),
                    'account_id' => $accountId,
                ]);
            }
            if (isset($types['Facebook']) && $this->faker->boolean(40)) {
                $contact->contactFields()->create([
                    'contact_field_type_id' => $types['Facebook']->id,
                    'data' => 'https://facebook.com/'.$this->faker->userName(),
                    'account_id' => $accountId,
                ]);
            }
        }

        // WhatsApp + Telegram messaging handles on a deterministic slice of contacts.
        // The default account already provisions these types via populateDefaultFields.
        if (isset($types['Whatsapp'])) {
            foreach (array_slice($this->supportingContacts, 0, 10) as $contact) {
                $contact->contactFields()->create([
                    'contact_field_type_id' => $types['Whatsapp']->id,
                    'data' => '+1'.$this->faker->numerify('##########'),
                    'account_id' => $accountId,
                ]);
            }
        }
        if (isset($types['Telegram'])) {
            foreach (array_slice($this->supportingContacts, 0, 6) as $contact) {
                $contact->contactFields()->create([
                    'contact_field_type_id' => $types['Telegram']->id,
                    'data' => '@'.$this->faker->userName(),
                    'account_id' => $accountId,
                ]);
            }
        }
    }

    private function populateAddresses(): void
    {
        $accountId = $this->demoAccount->id;
        $partner = $this->supportingContacts[0];
        $parent = $this->supportingContacts[1];
        $sibling = $this->supportingContacts[2];
        $morgan = $this->supportingContacts[3];
        $robin = $this->supportingContacts[4];
        $taylor = $this->supportingContacts[5];
        $riley = $this->supportingContacts[6];

        // 1. Full US address on the partner.
        app(CreateAddress::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'name' => 'Home',
            'street' => '742 Evergreen Terrace',
            'city' => 'Springfield',
            'province' => 'IL',
            'postal_code' => '62704',
            'country' => 'US',
        ]);

        // 2. Same partner — second address (Work) to exercise multi-address UI.
        app(CreateAddress::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'name' => 'Work',
            'street' => '500 Market Street, Suite 1200',
            'city' => 'San Francisco',
            'province' => 'CA',
            'postal_code' => '94105',
            'country' => 'US',
        ]);

        // 3. Partial (city + country only) on Jordan-Parent.
        app(CreateAddress::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $parent->id,
            'city' => 'Bristol',
            'country' => 'GB',
        ]);

        // 4. Country-only on Casey-Sibling.
        app(CreateAddress::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $sibling->id,
            'country' => 'JP',
        ]);

        // 5. Accented street name on Morgan-Friend (UTF-8 exercise).
        app(CreateAddress::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $morgan->id,
            'street' => '12 Rue de l\'Élysée',
            'city' => 'Paris',
            'postal_code' => '75008',
            'country' => 'FR',
        ]);

        // 6–8. Faker-generated complete addresses on Robin, Taylor, Riley.
        foreach ([$robin, $taylor, $riley] as $contact) {
            app(CreateAddress::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'street' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->randomElement(['CA', 'NY', 'TX', 'WA', 'ON', 'BC']),
                'postal_code' => $this->faker->postcode(),
                'country' => $this->faker->randomElement(['US', 'FR', 'GB', 'DE', 'JP']),
            ]);
        }
    }

    private function populateTags(): void
    {
        $accountId = $this->demoAccount->id;
        $partner = $this->supportingContacts[0];
        $parent = $this->supportingContacts[1];
        $sibling = $this->supportingContacts[2];
        $morgan = $this->supportingContacts[3];
        $robin = $this->supportingContacts[4];
        $taylor = $this->supportingContacts[5];
        $riley = $this->supportingContacts[6];

        $associate = function (Contact $contact, string $tagName) use ($accountId) {
            app(AssociateTag::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'name' => $tagName,
            ]);
        };

        // Deterministic assignments anchoring the 5-tag taxonomy.
        $associate($partner, 'family');
        $associate($parent, 'family');
        $associate($sibling, 'family');
        $associate($morgan, 'family');

        $associate($morgan, 'close-friends');
        $associate($robin, 'close-friends');

        $associate($taylor, 'work');
        $associate($riley, 'neighborhood');

        $associate($partner, 'important');
        $elodie = Contact::where('account_id', $accountId)
            ->where('first_name', 'Élodie')
            ->first();
        if ($elodie !== null) {
            $associate($elodie, 'important');
        }

        // Faker-random contacts (anything past the named scenario indices) get 1–2 random tags.
        $palette = ['family', 'close-friends', 'work', 'neighborhood', 'important'];
        foreach (array_slice($this->supportingContacts, 7) as $contact) {
            $count = $this->faker->numberBetween(1, 2);
            $picks = $this->faker->randomElements($palette, $count);
            foreach ($picks as $name) {
                $associate($contact, $name);
            }
        }
    }

    private function populateNotes(): void
    {
        $accountId = $this->demoAccount->id;

        foreach ($this->supportingContacts as $i => $contact) {
            $contact->notes()->create([
                'body' => $this->faker->realText(120),
                'account_id' => $accountId,
                'is_favorited' => false,
            ]);
            if ($i % 4 === 0) {
                // `favorited_at` is not in Note's $fillable, so set it after create().
                $favorited = $contact->notes()->create([
                    'body' => $this->faker->realText(600),
                    'account_id' => $accountId,
                    'is_favorited' => true,
                ]);
                $favorited->favorited_at = now()->subDays(3);
                $favorited->save();
            }
        }
    }

    private function populateCalls(): void
    {
        $accountId = $this->demoAccount->id;
        foreach ($this->supportingContacts as $contact) {
            if ($this->faker->boolean(60)) {
                $contact->calls()->create([
                    'account_id' => $accountId,
                    'called_at' => $this->faker->dateTimeThisYear(),
                ]);
            }
        }
    }

    private function populateConversations(): void
    {
        $accountId = $this->demoAccount->id;
        $phoneTypeId = ContactFieldType::where('account_id', $accountId)
            ->where('name', 'Phone')
            ->first()
            ->id;

        foreach (array_slice($this->supportingContacts, 0, 4) as $contact) {
            $conversation = app(CreateConversation::class)->execute([
                'happened_at' => $this->faker->dateTimeThisYear(),
                'contact_id' => $contact->id,
                'contact_field_type_id' => $phoneTypeId,
                'account_id' => $accountId,
            ]);

            foreach (range(1, 4) as $_) {
                app(AddMessageToConversation::class)->execute([
                    'account_id' => $accountId,
                    'contact_id' => $contact->id,
                    'conversation_id' => $conversation->id,
                    'written_at' => $this->faker->dateTimeThisYear(),
                    'written_by_me' => $this->faker->boolean(),
                    'content' => $this->faker->realText(80),
                ]);
            }
        }
    }

    private function populateActivities(): void
    {
        $accountId = $this->demoAccount->id;
        $activityType = $this->demoAccount->activityTypes->first();

        foreach (array_slice($this->supportingContacts, 0, 5) as $contact) {
            app(CreateActivity::class)->execute([
                'account_id' => $accountId,
                'activity_type_id' => $activityType?->id,
                'summary' => $this->faker->realText(50),
                'description' => $this->faker->realText(200),
                'happened_at' => $this->faker->dateTimeThisYear()->format('Y-m-d'),
                'contacts' => [$contact->id],
            ]);
        }
    }

    private function populateTasks(): void
    {
        $accountId = $this->demoAccount->id;

        foreach (array_slice($this->supportingContacts, 0, 6) as $i => $contact) {
            // Open task.
            $contact->tasks()->create([
                'account_id' => $accountId,
                'title' => $this->faker->realText(40),
                'description' => $this->faker->realText(160),
                'completed' => 0,
            ]);

            // Extra open task on the first three supporting contacts for density.
            if ($i < 3) {
                $contact->tasks()->create([
                    'account_id' => $accountId,
                    'title' => $this->faker->realText(40),
                    'description' => $this->faker->realText(200),
                    'completed' => 0,
                ]);
            }

            // Completed task on every second contact.
            if ($i % 2 === 0) {
                $contact->tasks()->create([
                    'account_id' => $accountId,
                    'title' => $this->faker->realText(40),
                    'description' => $this->faker->realText(160),
                    'completed' => 1,
                    'completed_at' => now()->subDays(7),
                ]);
            }
        }

        // Account-level tasks (no contact) — appear in the dashboard's general task list.
        $accountTitles = [
            'Buy birthday card stock',
            'Renew mailing list subscription',
            'Update emergency contacts list',
            'Schedule annual planning review',
            'Clean up duplicate contacts',
            'Export contact backup',
        ];
        foreach ($accountTitles as $title) {
            Task::create([
                'account_id' => $accountId,
                'contact_id' => null,
                'title' => $title,
                'description' => $this->faker->realText(400),
                'completed' => 0,
            ]);
        }
    }

    private function populateGifts(): void
    {
        $accountId = $this->demoAccount->id;

        // CreateGift only attaches a currency_id when Auth::check() is true.
        // Without it, demo gifts render with no currency symbol in the UI.
        Auth::setUser($this->demoUser);
        try {
            foreach (array_slice($this->supportingContacts, 0, 4) as $i => $contact) {
                app(CreateGift::class)->execute([
                    'account_id' => $accountId,
                    'contact_id' => $contact->id,
                    'status' => $i % 2 === 0 ? 'idea' : 'offered',
                    'name' => $this->faker->realText(30),
                    'comment' => $this->faker->realText(120),
                    'url' => $this->faker->url(),
                    'amount' => $this->faker->numberBetween(20, 150),
                ]);
            }
        } finally {
            Auth::logout();
        }
    }

    private function populateReminders(): void
    {
        $accountId = $this->demoAccount->id;
        $partner = $this->supportingContacts[0];
        $sibling = $this->supportingContacts[2];

        // Overdue one_time: CreateReminder->schedule() rolls past one_time dates forward by years
        // (DateHelper::addTimeAccordingToFrequencyType falls through to addYears for unknown types),
        // so the service-level path can't express "overdue". Direct write instead.
        Reminder::create([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Send overdue thank-you note',
            'description' => 'Still owed from the holidays.',
            'initial_date' => now()->subDays(10)->toDateString(),
            'next_expected_date' => now()->subDays(10),
            'frequency_type' => 'one_time',
            'frequency_number' => 1,
            'delible' => true,
        ]);

        // Upcoming one_time (~14 days out) on partner.
        app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Plan weekend trip',
            'description' => 'Pick a destination and book accommodation.',
            'initial_date' => now()->addDays(14)->toDateString(),
            'frequency_type' => 'one_time',
            'frequency_number' => 1,
        ]);

        // Weekly recurring on partner.
        app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Weekly check-in call',
            'initial_date' => now()->subDays(2)->toDateString(),
            'frequency_type' => 'week',
            'frequency_number' => 1,
        ]);

        // Monthly recurring on partner — used as the anchor for sent history.
        $monthly = app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Monthly date night',
            'description' => 'Pick a restaurant or activity.',
            'initial_date' => now()->subMonths(2)->toDateString(),
            'frequency_type' => 'month',
            'frequency_number' => 1,
        ]);

        // Extra weekly with a different initial_date for variety.
        app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Send a thoughtful text',
            'initial_date' => now()->subDays(5)->toDateString(),
            'frequency_type' => 'week',
            'frequency_number' => 2,
        ]);

        // Far-out one_time upcoming (~60 days) on partner.
        app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $partner->id,
            'title' => 'Anniversary surprise',
            'initial_date' => now()->addDays(60)->toDateString(),
            'frequency_type' => 'one_time',
            'frequency_number' => 1,
        ]);

        // Spread reminders across other contacts so the dashboard widget shows variety.
        $elodie = Contact::where('account_id', $accountId)
            ->where('first_name', 'Élodie')
            ->first();
        if ($elodie !== null) {
            app(CreateReminder::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $elodie->id,
                'title' => 'Send birthday card',
                'initial_date' => now()->addDays(30)->toDateString(),
                'frequency_type' => 'one_time',
                'frequency_number' => 1,
            ]);
        }

        app(CreateReminder::class)->execute([
            'account_id' => $accountId,
            'contact_id' => $sibling->id,
            'title' => 'Weekly sibling chat',
            'initial_date' => now()->subDays(3)->toDateString(),
            'frequency_type' => 'week',
            'frequency_number' => 1,
        ]);

        // Fired history records on the monthly reminder, so the reminder detail view shows a series.
        foreach ([7, 30, 60] as $daysAgo) {
            DB::table('reminders_sent')->insert([
                'account_id' => $accountId,
                'contact_id' => $partner->id,
                'reminder_id' => $monthly->id,
                'title' => $monthly->title,
                'description' => $monthly->description ?? '',
                'html_sent_content' => '<p>Monthly date night reminder.</p>',
                'sent_date' => now()->subDays($daysAgo),
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);
        }
    }

    private function populateJournal(): void
    {
        $accountId = $this->demoAccount->id;

        // 12 free-form journal entries spread across the last 90 days.
        // Pattern from JournalController::store: set $entry->date as a non-persisted
        // attribute after save so JournalEntry::add picks it up for the journal_entries.date column.
        $entryLengths = [
            200, 200, 200, 200,   // short
            500, 500, 500, 500,   // medium
            1200, 1200, 1200, 1200, // long-form
        ];
        foreach ($entryLengths as $length) {
            $entryDate = now()->subDays($this->faker->numberBetween(1, 90))
                ->setTime($this->faker->numberBetween(7, 22), $this->faker->numberBetween(0, 59));
            $entry = Entry::create([
                'account_id' => $accountId,
                'title' => $this->faker->realText(50),
                'post' => $this->faker->realText($length),
            ]);
            $entry->date = $entryDate;
            JournalEntry::add($entry);
        }

        // 30 day ratings across the last 30 days. Cluster around 3-4 (realistic).
        $ratingPalette = [1, 2, 3, 3, 3, 3, 4, 4, 4, 5];
        for ($daysAgo = 0; $daysAgo < 30; $daysAgo++) {
            $hasComment = $daysAgo < 10; // first 10 days get a short comment
            $day = Day::create([
                'account_id' => $accountId,
                'date' => now()->subDays($daysAgo)->toDateString(),
                'rate' => $this->faker->randomElement($ratingPalette),
                'comment' => $hasComment ? $this->faker->realText(80) : null,
            ]);
            JournalEntry::add($day);
        }
    }

    private function populateLifeEvents(): void
    {
        $accountId = $this->demoAccount->id;
        $partner = $this->supportingContacts[0];
        $sibling = $this->supportingContacts[2];
        $morgan = $this->supportingContacts[3];
        $robin = $this->supportingContacts[4];
        $elodie = Contact::where('account_id', $accountId)
            ->where('first_name', 'Élodie')
            ->first();

        $eventTypes = $this->demoAccount->lifeEventTypes()->get();
        if ($eventTypes->isEmpty()) {
            return;
        }
        $pickType = function () use ($eventTypes) {
            return $eventTypes->random()->id;
        };

        $events = [
            [$partner, 'Moved into our first place', 'Tiny apartment with a great view.', now()->subYears(3)],
            [$partner, 'Got engaged', 'On the hike to the lookout.', now()->subYears(1)],
            [$sibling, 'Started a new job', 'Switched industries entirely.', now()->subMonths(8)],
            [$morgan, 'Had a baby', 'A girl.', now()->subYears(2)->subMonths(3)],
            [$robin, 'Bought a house', 'After looking for over a year.', now()->subMonths(14)],
        ];
        if ($elodie !== null) {
            $events[] = [$elodie, 'Moved abroad', 'Settled in Lyon.', now()->subYears(4)];
            $events[] = [$elodie, 'Took up cycling', 'Riding to work most days.', now()->subMonths(9)];
        }
        // One filler event to keep total >= 8 even when Élodie is missing.
        $events[] = [$partner, 'Ran a half marathon', 'Slow but finished.', now()->subMonths(5)];

        foreach ($events as [$contact, $name, $note, $happenedAt]) {
            app(CreateLifeEvent::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'life_event_type_id' => $pickType(),
                'happened_at' => $happenedAt->toDateString(),
                'name' => $name,
                'note' => $note,
                'has_reminder' => false,
                'happened_at_month_unknown' => false,
                'happened_at_day_unknown' => false,
            ]);
        }
    }

    private function populateDebts(): void
    {
        $accountId = $this->demoAccount->id;
        $currencyId = $this->demoUser->currency_id;

        // No service for debts — direct model writes. Amounts are stored as integers (cents).
        $rows = [
            [$this->supportingContacts[0], 'yes', 'inprogress', 4500, 'Concert tickets'],
            [$this->supportingContacts[1], 'yes', 'inprogress', 12000, 'Split rent last month'],
            [$this->supportingContacts[3], 'yes', 'complete', 800, 'Coffee'],
            [$this->supportingContacts[2], 'no', 'inprogress', 6000, 'Lent me cash for the cab'],
            [$this->supportingContacts[4], 'no', 'inprogress', 2500, 'Dinner I forgot to pay back'],
            [$this->supportingContacts[5], 'no', 'complete', 3500, 'Birthday gift split'],
        ];
        foreach ($rows as [$contact, $inDebt, $status, $amount, $reason]) {
            Debt::create([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'in_debt' => $inDebt,
                'status' => $status,
                'amount' => $amount,
                'currency_id' => $currencyId,
                'reason' => $reason,
            ]);
        }
    }

    private function populateFoodPreferences(): void
    {
        $accountId = $this->demoAccount->id;
        $samples = [
            'Vegetarian. Loves spicy food, hates olives.',
            'Allergic to peanuts and tree nuts.',
            'Pescatarian. Big on Japanese cuisine.',
            'Gluten-free. Soft spot for good chocolate.',
            'No dietary restrictions. Adventurous eater.',
            'Lactose intolerant. Loves a good steak.',
            'Vegan. Always brings the best hummus.',
            'Loves Indian food. Mild only.',
            'Allergic to shellfish. Coffee snob.',
            'Keto-ish. Pizza every Friday.',
        ];
        foreach ($samples as $i => $note) {
            if (! isset($this->supportingContacts[$i])) {
                break;
            }
            app(UpdateContactFoodPreferences::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $this->supportingContacts[$i]->id,
                'food_preferences' => $note,
            ]);
        }
    }

    private function populateFirstMetInfo(): void
    {
        $accountId = $this->demoAccount->id;
        $partnerId = $this->supportingContacts[0]->id;
        $morganId = $this->supportingContacts[3]->id;

        $samples = [
            ['Bookstore on the corner', 'Reaching for the same poetry collection.', null],
            ['Sarah\'s wedding', 'Sat at the same table during the reception.', $partnerId],
            ['Climbing gym', 'Belayed for each other on a Tuesday night.', null],
            ['College orientation week', 'Lost together looking for the right lecture hall.', null],
            ['Pottery class', 'Both first-timers, both terrible at centering.', $morganId],
            ['On a flight', 'Window-seat conversation that lasted the whole flight.', null],
            ['Through friends', 'Mutual friend hosted a game night.', $partnerId],
            ['Local farmers market', 'Recommending each other vendors.', null],
            ['Work conference', 'Coffee line on day two.', null],
            ['Neighborhood block party', 'Asking who made the great salsa.', null],
        ];
        foreach ($samples as $i => [$where, $info, $through]) {
            if (! isset($this->supportingContacts[$i])) {
                break;
            }
            $contactId = $this->supportingContacts[$i]->id;
            if ($contactId === $through) {
                $through = null;
            }
            app(UpdateContactIntroduction::class)->execute([
                'account_id' => $accountId,
                'contact_id' => $contactId,
                'met_through_contact_id' => $through,
                'general_information' => $info,
                'where' => $where,
                'is_date_known' => false,
            ]);
        }
    }

    private function populateWorkInfo(): void
    {
        $accountId = $this->demoAccount->id;
        $authorId = $this->demoUser->id;

        $samples = [
            ['Product Manager', 'Northwind'],
            ['Nurse', 'St Mary\'s Hospital'],
            ['Software Engineer', 'Hooli'],
            ['Architect', 'Studio Lumen'],
            ['Teacher', 'Lincoln High'],
            ['Designer', 'Acme Studios'],
            ['Accountant', 'Pemberton & Co'],
            ['Carpenter', 'Self-employed'],
            ['Researcher', 'Polytechnic Institute'],
            ['Barista', 'Blue Bottle'],
            ['Photographer', 'Freelance'],
            ['Project Coordinator', 'Globex'],
        ];
        foreach ($samples as $i => [$job, $company]) {
            if (! isset($this->supportingContacts[$i])) {
                break;
            }
            app(UpdateWorkInformation::class)->execute([
                'account_id' => $accountId,
                'author_id' => $authorId,
                'contact_id' => $this->supportingContacts[$i]->id,
                'job' => $job,
                'company' => $company,
            ]);
        }
    }

    private function populateAttachments(): void
    {
        // Avatars: CreateContact already dispatches App\Jobs\Avatars\GenerateDefaultAvatar
        // synchronously (QUEUE_CONNECTION=sync in dev + test), so every demo contact already has
        // an avatar_default_url JPG written to storage. Nothing to do for avatars here.

        $accountId = $this->demoAccount->id;
        $disk = Storage::disk(config('filesystems.default'));
        $visibility = config('filesystems.default_visibility');

        // Documents: 5 contacts get a small text file each.
        $documentSamples = [
            ['meeting-notes.txt', "Topics discussed:\n- Q3 plan\n- Hiring update\n- Move date\n"],
            ['shared-recipe.txt', "Ingredients:\n- flour, butter, sugar\nNotes:\n- bakes for 25min at 180c\n"],
            ['book-list.txt', "Books to swap:\n- Pachinko\n- The Overstory\n- Klara and the Sun\n"],
            ['address-card.txt', "Old address from when they lived in Lyon. Keep for postcards.\n"],
            ['hike-checklist.txt', "Trail head meet at 0800. Bring water, snacks, layers.\n"],
        ];
        foreach ($documentSamples as $i => [$origFilename, $body]) {
            $contact = $this->supportingContacts[$i];
            $newFilename = 'documents/'.Str::random(40);
            $disk->put($newFilename, $body, $visibility);

            Document::create([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'original_filename' => $origFilename,
                'new_filename' => $newFilename,
                'filesize' => strlen($body),
                'type' => 'txt',
                'mime_type' => 'text/plain',
            ]);
        }

        // Photos: 5 contacts get a placeholder 120x120 solid-color PNG.
        // GD path was tried but PHPStan's Safe stubs conflict with PHP 8's GdImage
        // typing — an embedded base64 PNG is simpler and visually equivalent for
        // the regression target (exercises the photos tab and pivot relationship).
        $pngBytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAAACXBIWXMAAA7EAAAO'
            .'xAGVKw4bAAABIUlEQVR4nO3QQRHAIADAMEDrvGAROVOx8liioNd59jP43rod8BdG'
            .'R4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgdMTpidMToiNER'
            .'oyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgdMTpidMTo'
            .'iNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgdMTpi'
            .'dMToiNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgd'
            .'MTpidMToiNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeM'
            .'jhgdMTpidMToiNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMj'
            .'RkeMjhgdMTpidMToyAssNAKzl4iJ5QAAAABJRU5ErkJggg=='
        );

        foreach (range(0, 4) as $i) {
            $contact = $this->supportingContacts[$i];
            $newFilename = 'photos/'.Str::random(40).'.png';
            $disk->put($newFilename, $pngBytes, $visibility);

            $photo = Photo::create([
                'account_id' => $accountId,
                'original_filename' => 'snapshot.png',
                'new_filename' => $newFilename,
                'filesize' => strlen($pngBytes),
                'mime_type' => 'image/png',
            ]);
            $contact->photos()->syncWithoutDetaching([$photo->id]);
        }
    }

    private function populatePets(): void
    {
        $accountId = $this->demoAccount->id;
        $petCategoryId = DB::table('pet_categories')->value('id');

        foreach (array_slice($this->supportingContacts, 0, 3) as $contact) {
            DB::table('pets')->insert([
                'account_id' => $accountId,
                'contact_id' => $contact->id,
                'pet_category_id' => $petCategoryId,
                'name' => $this->faker->firstName(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
