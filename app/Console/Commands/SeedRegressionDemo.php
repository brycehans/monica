<?php

namespace App\Console\Commands;

use App\Models\Account\Account;
use App\Models\Contact\Contact;
use App\Models\User\User;
use App\Services\Contact\Contact\CreateContact;
use App\Services\Contact\Contact\UpdateBirthdayInformation;
use App\Services\Contact\Contact\UpdateDeceasedInformation;
use App\Services\Contact\Relationship\CreateRelationship;
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
    private array $supportingContacts = [];

    public function handle()
    {
        $seed = $this->resolveSeed();
        $this->setUpFaker();
        $this->faker->seed($seed);

        $this->buildDemoAccount();
        $this->buildEdgeCaseContacts();
        $this->buildSupportingContacts();
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
            'year' => (int) $soon->subYears(30)->format('Y'),
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
}
