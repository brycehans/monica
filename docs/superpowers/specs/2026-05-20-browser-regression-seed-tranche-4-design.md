# Browser Regression Seed — Tranche 4: Attachments

## Context

Tranches 1–3 covered all the database-only parts of the contact-detail page. This tranche fills the remaining storage-backed surfaces — avatars, documents, photos — so the per-contact attachment tabs render with real content during dependency-upgrade browser smoke walks.

## Findings during research

**Avatars are already populated.** `CreateContact` (used by every supporting contact in the seeder) dispatches the `App\Jobs\Avatars\GenerateDefaultAvatar` job at line 164. With `QUEUE_CONNECTION=sync` in both `.env.dev` and `.env.testing`, that job runs synchronously and writes a real JPG to `storage/app/avatars/<uuid>.jpg` plus sets `contact->avatar_default_url`. Every demo contact already has an avatar by the time `populateAttachments` would run.

So there's nothing to *do* for avatars — only an assertion to *pin* the contract.

## Scope

In scope:
- Documents — 5 contacts get a small text file written to `storage/app/documents/<random>` with a matching `documents` row.
- Photos — 5 contacts get a placeholder PNG written to `storage/app/photos/<random>.png` with a matching `photos` row, linked via the `contact_photo` pivot.
- A pinned assertion that contacts have `avatar_default_url` (a regression check on the existing avatar generation path).

## Approach

Add a single `populateAttachments` method, called near the tail of `handle()` after `populateWorkInfo`.

Documents: direct `Document::create()`. Five deterministic file bodies (meeting notes, recipe, book list, address card, hike checklist) written via `Storage::disk(config('filesystems.default'))->put()` at the same `documents/...` path the upload service uses. Metadata (`original_filename`, `filesize`, `type`, `mime_type`) is plausible.

Photos: direct `Photo::create()` + `$contact->photos()->syncWithoutDetaching([$photo->id])` to populate the `contact_photo` pivot. File content is a static 120×120 PNG embedded as base64 (one solid coral color, ~367 bytes). Five contacts share the same image — visual variety per-photo isn't a regression target; the photos tab rendering and pivot wiring are.

### Why a static base64 PNG over GD generation

A first pass used GD (`imagecreatetruecolor` + `imagefilledrectangle`) to generate five distinct colored PNGs. PHPStan's `thecodingmachine/safe` stubs annotate `imagecreatetruecolor` as returning `resource` (a stale PHP 7 annotation), but native `imagecolorallocate` requires `GdImage` (PHP 8). Adding a `@var \GdImage` hint to satisfy `imagecolorallocate` then breaks the Safe-typed `imagefilledrectangle`/`imagepng`/`imagedestroy` calls. The static-base64 path sidesteps the type drama entirely with no functional cost — 367 bytes embedded in source vs. five different-colored PNGs at runtime.

`base64_decode` still gets wrapped via `Safe\base64_decode` so PHPStan stays happy on the can-return-FALSE check.

## Acceptance test additions

4 new assertions:

- `Contact::whereNotNull('avatar_default_url')->count() >= 7` (pins the existing auto-avatar generation)
- `Document::where('account_id', ...)->count() >= 5`
- `Photo::where('account_id', ...)->count() >= 5`
- `contact_photo` pivot joined to `photos` for the demo account `>= 5`

The pivot assertion requires the join because `contact_photo` has no `account_id` column of its own (`contact_id`, `photo_id`, timestamps only).

Total: 68 → 76 assertions across the whole acceptance test.

## Risks / notes

**Storage cleanup between `--fresh-demo` runs.** `DestroyAccount` drops DB rows but does not necessarily clean every file on disk. Successive `--fresh-demo` runs will leave orphan files at `storage/app/documents/...` and `storage/app/photos/...`. Local-dev only; acceptable for now. Future cleanup hook could prune by querying the disk for files whose `new_filename` doesn't match a row, or by listing files older than a threshold.

**Two consecutive `--fresh-demo` runs produce identical row counts (20 contacts with avatar / 5 docs / 5 photos / 5 pivot rows).** Seed-stable on the DB side. File names differ each run (random suffix) but that's expected — file paths weren't a contract.

## Verification

- `vendor/bin/phpunit --filter SeedRegressionDemoTest` green at 76 assertions
- `vendor/bin/phpstan analyse app/Console/Commands/SeedRegressionDemo.php` clean
- `vendor/bin/psalm` clean (only info-level style suggestions)
- `vendor/bin/phpunit --testsuite Commands-Other` still 18/18 green
- Two consecutive `--fresh-demo` runs against dev DB produce identical row counts

## Out of scope

- Per-photo visual variety (one shared placeholder is enough for layout regression checks)
- Avatar variety beyond initials (the existing `GenerateDefaultAvatar` produces colored-initials JPGs that are already visually distinct per contact)
- Storage cleanup hook on `--fresh-demo` rebuilds (low priority, local-dev impact only)
