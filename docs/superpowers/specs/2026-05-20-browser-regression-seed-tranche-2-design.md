# Browser Regression Seed — Tranche 2: Empty-Pages Pass

## Context

Tranche 1 (`monica:seed-regression-demo`, shipped 2026-05-19) landed the must-have scenarios from the spec at `docs/superpowers/specs/2026-05-19-browser-regression-seed-data-design.md`: 20 contacts with edge cases, contact fields (Email/Phone/Facebook), notes, calls, conversations, activities, tasks, gifts, pets, relationships, and one yearly anniversary reminder.

Manual browser walk-through after Tranche 1 confirmed the dataset still feels sparse on several top-level screens. This tranche picks up the "empty-pages first" subset of the deferred list to make the browser regression walk meaningfully fuller.

## Scope

Pick up the deferred items that fill currently-empty top-level screens. Skip the small contact-detail-only fields (food preferences, first-met info, extra messaging handles) for a later tranche — they don't unblock any empty page.

In scope:
- Addresses with varied completeness
- Tags
- Reminders in overdue / upcoming / weekly / monthly states (plus the existing yearly), with sent history
- Journal entries + day ratings
- Task density (more per contact, account-level tasks)

Out of scope:
- Tasks with explicit due dates — the `tasks` table has no `due_at` column. Adding one is a schema change and violates the no-new-features posture. The spec's mention of "overdue/future-dated tasks" was aspirational; the data model can't express it.
- Documents, photos, avatar attachments — file fixtures defer to a later tranche.
- Food preferences, first-met info, WhatsApp/Telegram fields — defer.

## Approach

Add four new private methods to `app/Console/Commands/SeedRegressionDemo.php` and expand `populateTasks()` in place. Follow the existing pattern: deterministic anchor scenarios pinned by name or count, Faker-driven density elsewhere.

Order in `handle()`:

```
populateAddresses()   # after populateContactFields()
populateTags()        # after populateAddresses()
populateReminders()   # after the yearly anniversary already created
populateTasks()       # extended in place
populateJournal()     # near the end; account-level data
```

Service surface (all pre-existing):
- `App\Services\Contact\Address\CreateAddress` — handles `places` row internally
- `App\Services\Contact\Tag\AssociateTag` — create-if-missing + attach
- `App\Services\Contact\Reminder\CreateReminder` — for live reminders; raw `DB::insert` into `reminders_sent` for history
- Journal has no service class. Use `Entry::create([...])` + `JournalEntry::add($entry)` static; `Day::create([...])` + `JournalEntry::add($day)`. Matches the `populatePets()` direct-write pattern already in the file.

## Data shape

### Addresses

Pick 8 supporting contacts. Distribution:

- 1 full address (street, city, province, postal_code, country='US')
- 1 partial (city + country only)
- 1 country-only
- 1 contact with two addresses (`name` labels — "Home" + "Work")
- 1 with accented street name to exercise UTF-8
- 3 with Faker-generated complete addresses

Country codes drawn from a fixed set: US, FR, GB, DE, JP.

### Tags

Tag taxonomy (hard-coded, 5 names): `family`, `close-friends`, `work`, `neighborhood`, `important`.

Assignments:
- `family` → partner + first 3 supporting contacts after the partner
- `close-friends` → Morgan, Robin (the two Friend scenarios)
- `work` → Taylor (Coworker)
- `neighborhood` → Riley (Neighbor)
- `important` → partner + Élodie (so one contact carries 2 tags)
- Every Faker random contact: 1–2 random tags

### Reminders

On the partner contact (6):
- 1 overdue: `frequency_type='one_time'`, `initial_date=now()->subDays(10)`, title "Send overdue thank-you"
- 1 upcoming: `frequency_type='one_time'`, `initial_date=now()->addDays(14)`, title "Plan weekend trip"
- 1 weekly: `frequency_type='week'`, `frequency_number=1`, title "Weekly check-in call"
- 1 monthly: `frequency_type='month'`, `frequency_number=1`, title "Monthly date night"
- 1 extra weekly with different initial_date for variety
- 1 extra one-time upcoming further out (~60 days)

On other contacts (2):
- Élodie: one-time upcoming (~30 days)
- Casey Sibling: weekly recurring

Sent history (`reminders_sent`): 3 rows referencing the monthly reminder, with `sent_date` at -7d, -30d, -60d.

Existing yearly anniversary reminder (Sam Upcoming-Birthday) stays untouched.

### Tasks

Extend `populateTasks()`:
- Add 6 account-level tasks (no `contact_id`) with longer descriptions: "Buy birthday card stock", "Renew mailing list", "Update emergency contacts", "Schedule annual planning review", "Clean up duplicate contacts", "Export contact backup".
- Bump per-contact open task count from 1 to 2 on the first 3 supporting contacts.
- Use `realText(400)` for descriptions on the new tasks for more visual texture.

### Journal

- 12 `Entry` rows, dates spread across the last 90 days. Mix: 4 short (title + 1 paragraph via `realText(200)`), 4 medium (`realText(500)`), 4 long-form (`realText(1200)`). Set `created_at` manually before calling `JournalEntry::add($entry)` so the journal timeline shows real spread (Entry's `getDateAttribute` falls back to `created_at`).
- 30 `Day` rows for the last 30 days. Ratings cycle 1–5 with realistic clustering (more 3s and 4s than 1s and 5s). Short comments (`realText(80)`) on 10 of them.

## Acceptance test additions

Extend `tests/Commands/Tests/SeedRegressionDemoTest.php` with 14 new assertions:

**Addresses** (3):
- `assertGreaterThanOrEqual(8, Address::where('account_id', $demoAccount->id)->count())`
- `assertDatabaseHas('places', ['account_id'=>..., 'country'=>'US'])`
- `assertTrue(Address::where('account_id', ...)->whereNotNull('name')->exists())`

**Tags** (3):
- `assertDatabaseHas('tags', ['account_id'=>..., 'name'=>'family'])`
- `assertSame(5, Tag::where('account_id', ...)->count())`
- `assertGreaterThanOrEqual(12, DB::table('contact_tag')->where('account_id', ...)->count())`

**Reminders** (4):
- `assertGreaterThanOrEqual(8, Reminder::where('account_id', ...)->count())` — 1 yearly + 6 partner + 2 others
- `assertTrue(Reminder::where('account_id', ...)->where('frequency_type', 'week')->exists())`
- `assertTrue(Reminder::where('account_id', ...)->where('frequency_type', 'month')->exists())`
- `assertGreaterThanOrEqual(3, DB::table('reminders_sent')->where('account_id', ...)->count())`

**Tasks** (2):
- `assertGreaterThanOrEqual(6, Task::where('account_id', ...)->whereNull('contact_id')->count())`
- Bump existing open-task `assertGreaterThan(0, ...)` to `assertGreaterThanOrEqual(12, ...)`

**Journal** (3):
- `assertGreaterThanOrEqual(12, Entry::where('account_id', ...)->count())`
- `assertGreaterThanOrEqual(30, Day::where('account_id', ...)->count())`
- `assertGreaterThanOrEqual(42, JournalEntry::where('account_id', ...)->count())`

Total assertions: 25 → ~39.

## Risks

**Risk 1: `CreateReminder` may not tolerate past `one_time` `initial_date`.** `Reminder::calculateNextExpectedDate()` runs `while ($date->isPast()) { advance(); }`. For `one_time`, `DateHelper::addTimeAccordingToFrequencyType` likely does not advance the date — risking an infinite loop on the overdue scenario.

Mitigation: during implementation, spike `CreateReminder` with a past one_time date. If it loops or otherwise misbehaves, fall back to direct `Reminder::create([...])` + manual `ReminderOutbox` insert. Same direct-write pattern is already used by `populatePets()`.

**Risk 2: `CreatePlace` may dedupe across addresses.** Two addresses with identical city+country may share a `place_id`. Acceptable for the demo. Worth a one-line note in implementation if it surprises.

**Risk 3: `JournalEntry::add($entry)` date handling.** `Entry`'s table (`entries`) has no `date` column. `JournalEntry::add` reads `$entry->attributes['date']` for Entry instances — which won't exist. The journal's display falls back to `Entry::getDateAttribute` → `created_at`. Mitigation: set `created_at` manually on each Entry before calling `JournalEntry::add()`, and accept that JournalEntry's own `date` column will be `now()` (it's only used internally for sort order on the morphed timeline — the displayed date comes from the journalable).

## Verification

- Acceptance test green (39 assertions) via `vendor/bin/phpunit --filter SeedRegressionDemoTest`
- `vendor/bin/phpstan analyse app/Console/Commands/SeedRegressionDemo.php` clean
- `vendor/bin/psalm` clean
- Manual browser smoke walk against a freshly-seeded dev DB:
  - Contact detail for partner: addresses, tags, reminders all render
  - `/journal` shows 12 entries + 30 day ratings, mixed timeline
  - Reminder section on partner's contact shows overdue + upcoming + recurring rows
  - Tags page or contact-filter UI shows the 5-tag taxonomy
- `--fresh-demo` re-run produces identical row counts (seed-stable, no drift)

## Out of scope (deferred again)

- Documents / photos / avatars
- Food preferences
- First-met info
- WhatsApp / Telegram contact field types
- Tasks with explicit due dates (requires schema change)
