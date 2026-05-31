# Browser Regression Seed Data Design

## Context

The dependency upgrade epic needs a fast way to spot user-facing regressions after Composer, npm, PHP, Laravel, Vue, and build-tool changes. Monica currently has factories and a broad feature test suite, but the default seed path is very small: `DatabaseSeeder` creates only an admin account and a blank account through `FakeUserTableSeeder`.

There is also an existing `setup:test` command that can generate a fake local account with many contacts and related records. That command proves the app already has service-level APIs for populating realistic data, but its interactive flow, destructive setup, uncontrolled randomness, and generic output make it less suitable as a repeatable browser-regression fixture.

## Goal

Create an opt-in browser QA dataset that makes visual and exploratory regression checks pleasant after each dependency-upgrade tranche.

The dataset should help a maintainer answer: "Does the app still look and behave right across representative Monica screens?"

## Non-Goals

- Do not replace focused unit, feature, API, or Dusk tests.
- Do not automatically load this dataset for every test run.
- Do not create a large performance benchmark dataset in the first tranche.
- Do not make the regression dataset depend on production services.

## Approach

Add a dedicated regression-demo seed path. It creates:

- A rich demo account for browser inspection.
- A blank account for empty-state inspection.
- A curated set of important contact and account scenarios.
- Faker-generated human texture for names, addresses, phone numbers, notes, messages, activities, and other readable content.

Faker randomness is allowed and desirable because the browser dataset should feel natural. The default command should still accept or choose a fixed seed so maintainers can rebuild the same world when comparing behavior before and after upgrades. A later option can enable fresh random data when variety is more useful than reproducibility.

## Accounts

The seed path should create stable credentials:

- `test@example.com` / `password` for the rich account.
- `blank@example.com` / `password` for empty-state checks.

(The originally drafted `demo@example.test` / `demo0` and `blank@example.test` / `blank0` were dropped because Monica's `CreateUser` validator requires `password|min:6`. The 8-char `password` also makes sign-in trivial during browser smoke walks.)

The rich account should call the same default-account setup paths as normal account creation, including default fields, default activity types, relationship types, genders, and policy acceptance if required for the UI.

The seeder should be idempotent enough for local use. The preferred behavior is to delete or rebuild only the known demo accounts, not silently mutate arbitrary local data.

## Rich Demo Account Data

The first version should target roughly 12-20 primary contacts. That is enough to exercise list, detail, search, timeline, and relationship screens without burying the maintainer in filler.

The contact set should include:

- A partner or spouse.
- Immediate family.
- Close friends.
- A coworker.
- A neighbor or local contact.
- A partial contact.
- An archived contact.
- A deceased contact.
- A contact with accented or non-ASCII characters.
- A contact with a very long display name.
- A contact with missing birthday information.
- A contact with an upcoming birthday or important date.

Each important screen should have at least one visible example:

- Contact fields: email, phone, social links, messaging handles.
- Addresses with varied completeness.
- Tags.
- Notes, including favorited and long notes.
- Calls.
- Conversations with multiple messages.
- Activities and journal entries.
- Tasks across open, completed, overdue, and future states.
- Reminders across overdue, upcoming, recurring, and completed states.
- Gifts across idea and offered states.
- Relationships between contacts.
- Pets.
- Food preferences and first-met information.

Where the app has storage-backed features such as documents, photos, or avatars, the first implementation should prefer safe metadata or small local fixtures only. It should not require external downloads.

## Deferred to Follow-Up Tranches

The first version delivers the must-have scenarios above and deliberately defers the following to keep the implementation tractable. Each is on the spec's "important screen" list and should be added once the baseline browser smoke pass is exercising the modernization-ladder upgrades.

- Addresses with varied completeness.
- Tags.
- Messaging handles (Whatsapp, Telegram). Email, Phone, and Facebook are covered.
- Journal entries (`entries` + `journal_entries` rows). Activities are covered.
- Day ratings.
- Food preferences on the populated contacts.
- First-met information (`first_met_*` fields).
- Tasks with explicit overdue and future-dated states. Open and completed are covered, but every task currently has no due date.
- Reminders beyond the single yearly anniversary reminder produced by the upcoming-birthday contact's `add_reminder=true`. Spec called for overdue, upcoming, recurring, and completed reminder states.
- Documents, photos, and avatar attachments.

The acceptance test pins the must-have set above. Adding deferred items should also extend `tests/Commands/Tests/SeedRegressionDemoTest.php` so the regression dataset's intended shape stays explicit.

## Randomness Policy

Use Faker to make records readable and varied.

Use deterministic anchors for regression value:

- Stable account emails.
- Stable command name.
- Stable scenario names in comments or helper method names.
- Stable edge-case records.
- A fixed Faker seed by default.

The exact generated names and text may be fake, but the scenarios should always exist. For example, the dataset must always include an archived contact, a deceased contact, an overdue task, and a future reminder.

## Entry Point

Expose the dataset through a clear local command or seeder invocation. A command is preferred because it can own safety checks and options.

Suggested command shape:

```bash
php artisan monica:seed-regression-demo
```

Useful options:

- `--fresh-demo`: rebuild only the known demo and blank accounts.
- `--seed=12345`: choose the Faker seed.
- `--random`: use a fresh seed and print it for later reproduction.
- `--contacts=20`: tune supporting contact count.

The command should avoid a global `migrate:fresh` by default. Full environment rebuilds should remain explicit and separate.

## Verification

The implementation should include at least one automated smoke check proving the seeder can run on a migrated test database and creates the two expected login accounts plus representative records.

Manual verification for the first tranche:

- Rebuild the demo data.
- Log in as the rich demo user.
- Inspect dashboard, contact list, contact detail, reminders, journal, activities, settings, and search.
- Log in as the blank user.
- Inspect empty states.

## Future Extensions

After the browser dataset exists, future tranches can add:

- A large-account performance seed mode.
- Dusk smoke tests that log into the demo account and visit representative pages.
- Screenshot comparison checkpoints for dependency-upgrade review.
- Reusable scenario builders for automated feature tests.
