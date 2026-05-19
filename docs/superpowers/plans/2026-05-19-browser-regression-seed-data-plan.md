# Browser Regression Seed Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a `php artisan monica:seed-regression-demo` command that builds a curated demo account plus a blank account so a maintainer can spot user-facing regressions after each dependency-upgrade tranche.

**Architecture:** A single artisan command under `app/Console/Commands/SeedRegressionDemo.php` that mirrors the structure of `SetupTest` (monolithic, service-driven). It reuses `Account::createDefault()` for full default-field provisioning, calls existing domain services (`CreateContact`, `CreateReminder`, `CreateGift`, `CreateConversation`, `AddMessageToConversation`, `CreateActivity`, `CreateRelationship`, `UpdateBirthdayInformation`, `UpdateDeceasedInformation`, `AssociateTag`, `CreateAddress`) for record creation, and uses `\Illuminate\Foundation\Testing\WithFaker` for seeded Faker output. Idempotency comes from a guarded delete of the two known demo accounts via `App\Services\Account\Settings\DestroyAccount`.

**Tech Stack:** PHP 8.1, Laravel 9, FakerPHP via `WithFaker`, Monica's `app/Services/*` aggregate services, PHPUnit `DatabaseTransactions`.

**Spec:** `docs/superpowers/specs/2026-05-19-browser-regression-seed-data-design.md`

**Acceptance test (already written):** `tests/Commands/Tests/SeedRegressionDemoTest.php`

---

## Pre-flight

**Worktree recommendation:** Optional — the change touches one new command file plus minor wiring. If running multiple agents in parallel, create a worktree first; otherwise work in the current `4.x` checkout is fine.

**Initial test baseline.** Before touching anything, run the acceptance test to confirm it fails for the expected reason (command does not exist).

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: failure with something like "Command 'monica:seed-regression-demo' is not defined." That is our RED state for the whole plan.

**Key signatures and patterns established by exploration of the codebase:**

- `Account::createDefault(string $first, string $last, string $email, string $password, ?string $ip = null, ?string $lang = null): Account` — creates the account, the first user via `CreateUser`, and calls `populateDefaultFields()` (contact field types, genders, reminder rules, relationship types, activity types, life event types, modules). This is the same path normal signup uses.
- `CreateUser` validates `password|min:6`, so demo credentials must be ≥6 chars.
- `User` password column is bcrypt-hashed inside `CreateUser` (Laravel 9 era — no `hashed` cast). So `Hash::check('password', $user->password)` works after `createDefault(..., 'password', ...)`.
- `WithFaker` trait provides `$this->faker` after calling `$this->setUpFaker()`. Seed determinism is added by `$this->faker->seed($seed)` immediately after `setUpFaker()`. **Do not call `rand()` or `mt_rand()` in this command** — those are not Faker-seeded, so any randomness must go through `$this->faker`.
- The new test lands under the `Commands-Scheduling` PHPUnit testsuite per `phpunit.xml` (`tests/Commands/Tests/`).
- Pets and journal entries are inserted via `DB::table(...)->insert(...)` in `SetupTest`; there's no service for them. Match that convention.

---

## Task 1: Scaffold the command

**Files:**
- Create: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Write the scaffold**

```php
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
```

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: command is now defined; test fails on `assertNotNull($demoUser)` (no account created yet) — that's the new failure mode and confirms the command is wired.

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: scaffold monica:seed-regression-demo command"
```

---

## Task 2: Wire Faker with a deterministic seed

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Resolve the seed in `handle()`**

Replace `handle()`:

```php
public function handle()
{
    $seed = $this->resolveSeed();
    $this->setUpFaker();
    $this->faker->seed($seed);

    $this->info("Browser regression demo data created.");
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
```

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: still fails (no account yet) but no faker errors in output.

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: seed faker deterministically in seed-regression-demo"
```

---

## Task 3: Provision the demo and blank accounts

This unlocks all the user/password/account assertions and the `Contact::where blank=0` assertion.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Add account provisioning**

Add these `use` statements at the top:

```php
use App\Models\Account\Account;
use App\Models\User\User;
```

Add two helper methods and call them from `handle()` *before* the final `info()`:

```php
private Account $demoAccount;
private Account $blankAccount;
private User $demoUser;

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
```

In `handle()`, between the faker setup and the final `info()`:

```php
$this->buildDemoAccount();
$this->buildBlankAccount();
```

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected progress:
- `assertNotNull($demoUser)` — PASS
- `assertNotNull($blankUser)` — PASS
- `Hash::check('password', $demoUser->password)` — PASS
- `Hash::check('password', $blankUser->password)` — PASS
- `Contact::where blankAccount count = 0` — PASS
- `Contact::where demoAccount count >= 12` — still FAIL (no contacts yet)
- All subsequent counts — FAIL

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: provision demo and blank accounts in seed-regression-demo"
```

---

## Task 4: Add the stable edge-case contacts

This unlocks the four `assertDatabaseHas('contacts', ...)` assertions: Demo Partial, Demo Archived, Demo Deceased, Élodie.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Add edge-case contacts**

Add `use` statements:

```php
use App\Models\Contact\Contact;
use App\Services\Contact\Contact\CreateContact;
use App\Services\Contact\Contact\UpdateBirthdayInformation;
use App\Services\Contact\Contact\UpdateDeceasedInformation;
```

Add `buildEdgeCaseContacts()` and call it from `handle()` after `buildDemoAccount()` and before `buildBlankAccount()`.

```php
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

    // Contact with no birthday — covered by default state of every contact above.
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
```

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected progress:
- All four `assertDatabaseHas` — PASS
- `Contact >= 12` — still FAIL (we have ~6)
- A yearly reminder may already exist via the upcoming-birthday `add_reminder => true`, so `Reminder where frequency_type = year` likely PASSES here. Check the output.

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: seed stable edge-case contacts for browser regression"
```

---

## Task 5: Add supporting contacts with relationships

This brings the contact count above 12 and unlocks the `Relationship > 0` assertion.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Add supporting contacts**

Add `use` statements:

```php
use App\Services\Contact\Relationship\CreateRelationship;
```

Add a private property and helper that creates a fixed roster of named scenario contacts (partner, parent, sibling, two friends, coworker, neighbor) plus filler up to `--contacts` total. Each scenario contact gets a relationship to the partner (or to the demo's first contact).

```php
private array $supportingContacts = [];

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
```

Call `buildSupportingContacts()` from `handle()` right after `buildEdgeCaseContacts()`.

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected progress:
- `Contact >= 12` — PASS
- `Relationship > 0` — PASS

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: add named supporting contacts with relationships"
```

---

## Task 6: Add contact fields (email/phone/social)

Unlocks `ContactField > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Add the populate**

Add `use`:

```php
use App\Models\Contact\ContactFieldType;
```

Add and call:

```php
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
}
```

Call after `buildSupportingContacts()`.

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: `ContactField > 0` PASS.

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: seed contact fields for supporting contacts"
```

---

## Task 7: Add notes (including favorited and long)

Unlocks `Note::favorited() > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate notes**

```php
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
            $contact->notes()->create([
                'body' => $this->faker->realText(600),
                'account_id' => $accountId,
                'is_favorited' => true,
                'favorited_at' => now()->subDays(3),
            ]);
        }
    }
}
```

Call after `populateContactFields()`.

**Step 2: Run the test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: `Note::favorited() > 0` PASS.

**Step 3: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: seed notes including favorited examples"
```

---

## Task 8: Add calls

Unlocks `Call > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate calls**

```php
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
```

Call after `populateNotes()`.

**Step 2: Run the test, Step 3: Commit**

Same pattern. Commit message: `feat: seed calls for browser regression`.

---

## Task 9: Add conversations and messages

Unlocks `Conversation > 0` and `Message > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate**

Add `use`:

```php
use App\Services\Contact\Conversation\CreateConversation;
use App\Services\Contact\Conversation\AddMessageToConversation;
```

```php
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
```

Call after `populateCalls()`.

**Step 2-3:** Run test, commit. Commit message: `feat: seed conversations and messages`.

---

## Task 10: Add activities

Unlocks `Activity > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate**

Add `use`:

```php
use App\Services\Account\Activity\Activity\CreateActivity;
```

```php
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
```

Call after `populateConversations()`.

**Step 2-3:** Run test, commit. Commit message: `feat: seed activities`.

---

## Task 11: Add tasks (open + completed)

Unlocks `Task::inProgress() > 0` and `Task::completed() > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate**

```php
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
}
```

Call after `populateActivities()`.

**Step 2-3:** Run test, commit. Commit message: `feat: seed open and completed tasks`.

---

## Task 12: Add a yearly recurring reminder

Unlocks `Reminder where frequency_type = year > 0`.

> The upcoming-birthday contact from Task 4 already creates a yearly reminder via `add_reminder => true`, so this assertion may already be green. **Run the test first** — if it passes already, this task is a no-op other than confirming. Otherwise add an explicit reminder:

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Run the test first**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

If the yearly-reminder assertion passes already, skip to Step 3 with no code change.

**Step 2 (only if needed): Add an anniversary reminder**

Add `use`:

```php
use App\Services\Contact\Reminder\CreateReminder;
```

```php
private function populateReminders(): void
{
    app(CreateReminder::class)->execute([
        'account_id' => $this->demoAccount->id,
        'contact_id' => $this->supportingContacts[0]->id,
        'initial_date' => now()->addMonth()->toDateString(),
        'frequency_type' => 'year',
        'frequency_number' => 1,
        'title' => 'Anniversary',
    ]);
}
```

Call after `populateTasks()`.

**Step 3:** Run test, commit. Commit message: `feat: ensure yearly reminder exists in regression demo` (or skip if already green).

---

## Task 13: Add gifts (idea + offered)

Unlocks `Gift::isIdea() > 0` and `Gift::offered() > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate**

Add `use`:

```php
use App\Services\Contact\Gift\CreateGift;
```

```php
private function populateGifts(): void
{
    $accountId = $this->demoAccount->id;

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
}
```

Call after `populateReminders()` (or after `populateTasks()` if Task 12 was a no-op).

**Step 2-3:** Run test, commit. Commit message: `feat: seed gifts as idea and offered`.

---

## Task 14: Add pets

Unlocks `Pet > 0`.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Populate**

Add `use`:

```php
use Illuminate\Support\Facades\DB;
```

```php
private function populatePets(): void
{
    $accountId = $this->demoAccount->id;
    foreach (array_slice($this->supportingContacts, 0, 3) as $contact) {
        DB::table('pets')->insert([
            'account_id' => $accountId,
            'contact_id' => $contact->id,
            'pet_category_id' => 1,
            'name' => $this->faker->firstName(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
```

Call after `populateGifts()`.

> **Note:** `pet_category_id` is a small fixed set in the pet_categories table. If `1` doesn't exist in the test database, switch to `DB::table('pet_categories')->value('id')` or pull a category off the account via the seeded `PetCategory` data. Check by running the test.

**Step 2-3:** Run test, commit. Commit message: `feat: seed pets for demo contacts`.

---

## Task 15: Confirm full test passes end-to-end

By now every assertion in `SeedRegressionDemoTest::it_creates_a_browser_regression_demo_dataset` should be green.

**Step 1: Run the full target test**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

Expected: 1 / 1 passing.

**Step 2: Run the surrounding test slice for regressions**

```bash
vendor/bin/phpunit --testsuite Commands-Scheduling
```

Expected: full suite green; no regressions in adjacent test classes.

**Step 3: Static analysis**

```bash
vendor/bin/phpstan analyse --no-progress app/Console/Commands/SeedRegressionDemo.php
vendor/bin/psalm app/Console/Commands/SeedRegressionDemo.php
```

Fix anything they catch. Commit fixes if needed.

---

## Task 16: Add idempotency via `--fresh-demo`

Default behavior: if either demo account already exists, abort with a message. With `--fresh-demo`, destroy both demo accounts (and only them) before rebuilding.

**Files:**
- Modify: `app/Console/Commands/SeedRegressionDemo.php`

**Step 1: Add the guard**

Add `use`:

```php
use App\Services\Account\Settings\DestroyAccount;
```

Add a helper and call it at the top of `handle()` before account creation:

```php
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
```

In `handle()`:

```php
if (! $this->prepareAccountsForSeeding()) {
    return 1;
}
```

**Step 2: Smoke test the new path manually**

```bash
php artisan migrate:fresh --env=testing
php artisan monica:seed-regression-demo
php artisan monica:seed-regression-demo
```

Expected on the second run: error message, no duplicate accounts.

```bash
php artisan monica:seed-regression-demo --fresh-demo
```

Expected: completes cleanly.

> If running against the dev DB instead of testing, drop `--env=testing` and use the local DB.

**Step 3: Run the test suite**

```bash
vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php
```

The test uses `DatabaseTransactions` and a clean test DB, so no pre-existing accounts — both branches stay green.

**Step 4: Commit**

```bash
git add app/Console/Commands/SeedRegressionDemo.php
git commit -m "feat: add --fresh-demo idempotency for seed-regression-demo"
```

---

## Task 17: Manual browser verification

This is the final check from the spec's Verification section. Not code — a smoke pass to catch anything the test doesn't.

**Step 1: Build the demo dataset**

```bash
php artisan migrate:fresh
php artisan monica:seed-regression-demo --fresh-demo
yarn run dev
```

**Step 2: Start the dev server**

```bash
docker compose -f docker-compose.dev.yml up
```

or whatever the user's local server pattern is.

**Step 3: Log in as `test@example.com` / `password`**

Walk through:
- Dashboard.
- Contact list (search, filter).
- Contact detail for Demo Partial, Demo Archived, Demo Deceased, Élodie, the long-name contact, and the upcoming-birthday contact.
- Reminders.
- Journal.
- Activities.
- Settings.
- Search.

Note anything that looks broken in a separate scratch file — do **not** roll fixes into this branch unless they're trivially regression-blockers.

**Step 4: Log in as `blank@example.com` / `password`**

Walk through the same screens to verify empty states render.

**Step 5: Document findings**

If everything looks good, write a one-paragraph status in the PR description. If you found issues, file follow-ups; don't expand this branch's scope.

---

## Out of scope for this plan

Per the spec's Non-Goals and Future Extensions:

- No large-account performance seed mode.
- No Dusk smoke tests built on the demo account (future tranche).
- No screenshot comparison checkpoints.
- No reusable scenario builders extracted from this command (single-purpose for now; refactor only if a second consumer appears).

If a Task above reveals that the existing services have a bug, fix it on a separate branch and rebase this branch on top, rather than mixing fixes into the seed command.

---

## Final commit checklist

- [ ] `vendor/bin/phpunit tests/Commands/Tests/SeedRegressionDemoTest.php` passes.
- [ ] `vendor/bin/phpunit --testsuite Commands-Scheduling` passes.
- [ ] `vendor/bin/phpstan analyse` is clean for the new file.
- [ ] `vendor/bin/psalm` is clean for the new file.
- [ ] Manual smoke pass complete on both accounts.
- [ ] PR title uses Conventional Commits, lowercase (e.g. `feat: add monica:seed-regression-demo browser regression seeder`).
