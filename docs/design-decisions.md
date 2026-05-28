# Design decisions

Notes on what's deliberately in and out of the fork, beyond what's covered by
the high-level scope in the [README](../README.md). Entries here document
choices that aren't obvious from reading the code or the upstream history.

## OAuth grant types: `password` and `authorization_code` only

Monica's OAuth surface (via [Laravel Passport](https://laravel.com/docs/passport))
supports two grants and no others:

- **`password` grant** — used by the official mobile clients.
- **`authorization_code` grant** — used by third-party integrations.

Explicitly **not supported**:

- **`device_code` grant (RFC 8628)** — disabled in
  `app/Providers/AuthServiceProvider::register()`. Passport 13 added this grant
  and ships it enabled by default; Monica neither needs it (no input-constrained
  clients like TVs, IoT, or CLIs in the user base) nor exposes a UI for it. The
  matching `oauth_device_codes` migration is still shipped, byte-identical to
  the vendor copy, so re-enabling the grant is a one-line flip if a future
  consumer ever needs it. See PR
  [#720](https://github.com/brycehans/monica/pull/720) for the full reasoning.

This isn't a divergence from upstream Monica — upstream v4 was on Passport 12,
which didn't have device-code grant at all. The fork's Laravel 12 / Passport 13
upgrade ([#677](https://github.com/brycehans/monica/pull/677)) inherited the
new grant by default; #720 turned it back off to match Monica's actual auth
surface.
