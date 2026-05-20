# Browser Regression Seed — Tranche 3: Fill the Remaining Contact-Detail Sections

## Context

Tranche 1 shipped the must-have contacts and the core domains (notes, calls, conversations, activities, tasks, gifts, pets, relationships, anniversary reminder). Tranche 2 filled the empty top-level screens (addresses, tags, varied reminders with sent history, journal, denser tasks).

Manual smoke after tranche 2 confirmed the empty-pages pass works. This tranche closes the remaining gaps — the two empty tabs on the contact-detail page (life events, debts) and the small empty sections (food preferences, first-met info, job/company, WhatsApp/Telegram handles).

## Scope

In scope:
- Life events tab (8 events across 4-5 contacts)
- Debts tab (6 debts across the in_debt × status matrix)
- Food preferences (10 contacts)
- First-met info (10 contacts, 3 with the `met_through_contact_id` cross-link)
- Job + company strings (12 contacts)
- WhatsApp + Telegram contact fields (10 + 6 contacts)

Out of scope (still deferred):
- Documents, photos, avatars — needs file fixtures + storage config; warrants its own tranche.
- The full `Occupation` model (with `company_id` to the `companies` table). The visible "Current job" section reads `contact->job` / `contact->company` strings, which is what `UpdateWorkInformation` sets. The relational `Occupation` is a separate work-history feature; skipped to keep this tranche tight.

## Services used

All pre-existing:
- `CreateLifeEvent` — needs `life_event_type_id` (account already has defaults from `populateDefaultFields`).
- `UpdateContactFoodPreferences`
- `UpdateContactIntroduction` — sets `first_met_where`, `first_met_additional_info`, `first_met_through_contact_id`.
- `UpdateWorkInformation` — sets `job` + `company` strings.

No service for `Debt` — direct `Debt::create()`. Same pattern as `populatePets` and `populateReminders` (overdue case).

## Data shape

### Life events (`populateLifeEvents`)

8 events: 3 on the partner, 2 on Élodie, 1 each on Casey, Morgan, Robin. Names + notes use deterministic strings ("Moved into our first place", "Got engaged", "Bought a house") so the timeline looks lived-in rather than Faker word-salad. `life_event_type_id` drawn randomly from the account's defaults.

### Debts (`populateDebts`)

6 debts covering the matrix:

| in_debt | status | count |
|---|---|---|
| yes (they owe me) | inprogress | 2 |
| yes | complete | 1 |
| no (I owe them) | inprogress | 2 |
| no | complete | 1 |

Amounts stored as integers (cents-equivalent). `currency_id` from `demoUser->currency_id`. Each debt has a short `reason` string ("Concert tickets", "Split rent last month", etc).

### Food preferences (`populateFoodPreferences`)

10 contacts get a one-sentence food preference (10 deterministic samples covering common patterns: vegetarian, vegan, allergies, gluten-free, lactose intolerant, "no restrictions"). Via `UpdateContactFoodPreferences`.

Note: the `contacts` table column is `food_preferences` (renamed from `food_preferencies` in migration `2019_05_15_205533_rename_preferences`).

### First-met info (`populateFirstMetInfo`)

10 contacts get a `first_met_where` location + `first_met_additional_info` note. 3 contacts also get `met_through_contact_id` linking back to the partner or Morgan, so the cross-link UX has something to click. `is_date_known=false` everywhere — keeps the form data tight.

### Work info (`populateWorkInfo`)

12 contacts get `job` + `company` strings (the existing 7 named scenario contacts + 5 Faker fillers). Job + company are deterministic samples ("Product Manager / Northwind", "Nurse / St Mary's Hospital", etc.) rather than Faker so the contact list looks realistic.

### Messaging handles (extend `populateContactFields`)

`Whatsapp` and `Telegram` types already exist in `default_contact_field_types` (provisioned by `Account::createDefault`). Added 10 WhatsApp handles (E.164-shaped numbers) and 6 Telegram handles (`@username`) to the existing `populateContactFields` method.

## Acceptance test additions

10 new assertions:

- `LifeEvent::count() >= 8`
- `Debt::count() >= 6`
- `Debt::due()->exists()` — at least one in_debt=yes
- `Debt::owed()->exists()` — at least one in_debt=no
- One debt with `status=complete`
- `Contact::whereNotNull('food_preferences')->count() >= 10`
- `Contact::whereNotNull('first_met_where')->count() >= 10`
- `Contact::whereNotNull('first_met_through_contact_id')->count() > 0`
- `Contact::whereNotNull('job')->count() >= 12`
- WhatsApp `ContactField` rows >= 10
- Telegram `ContactField` rows >= 6

Plus 2 `assertNotNull` sanity checks confirming the Whatsapp/Telegram default types exist.

Total: 60 → 68 assertions.

## Verification

- `vendor/bin/phpunit --filter SeedRegressionDemoTest` green at 68 assertions.
- `vendor/bin/phpstan analyse app/Console/Commands/SeedRegressionDemo.php` clean.
- `vendor/bin/psalm` clean (only info-level style suggestions).
- `vendor/bin/phpunit --testsuite Commands-Other` still green (18 tests).
- Two consecutive `--fresh-demo` runs produce identical row counts (seed-stable).

## Out of scope (deferred again)

- Documents, photos, avatar attachments — needs file fixtures; warrants its own tranche with storage-config work.
- The relational `Occupation` model — separate work-history feature, low visual impact since the contact-detail "Current job" section reads the string columns.
