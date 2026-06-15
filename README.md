# Monica v4 — Community Maintenance

> A community-maintained continuation of the v4 line of
> [Monica](https://github.com/monicahq/monica) — the open-source Personal
> Relationship Manager created by Régis Freyd ([@djaiss](https://github.com/djaiss))
> and Alexis Saettler ([@asbiin](https://github.com/asbiin)).

## Why this fork exists

Monica v4 runs on tens of thousands of self-hosted instances. Upstream
maintenance of the v4 line has paused while its maintainers focus on
successor work. Those existing v4 deployments still need:

- security updates and dependency patches
- compatibility with modern PHP and Laravel
- working Docker images and build pipelines
- responses to bug reports

This fork exists to provide exactly that, while modernizing the codebase's
internals enough to keep contributing to it pleasant. The goal is to keep
v4 alive, secure, runnable, and maintainable for the people who already
rely on it. No new features. No UI redesigns. No competing roadmap.

## What this fork is not

- **Not a hostile fork.** We have no quarrel with upstream. We hold the
  Monica maintainers in the highest regard for nearly a decade of work
  that made any of this possible.
- **Not a user-facing rewrite.** We are not redesigning the UI, adding
  new features, or changing the data model. Internal modernization that
  keeps user-facing behaviour identical (Composition API, TypeScript on
  the frontend, dropping Bootstrap 4 + jQuery) is in scope.
- **Not the official Monica.** The Monica name and brand belong to
  Monica HQ SAS. This is a community maintenance fork distributed under
  the original AGPL-3.0-or-later license.
- **Not a permanent commitment.** This is volunteer work. If upstream
  resumes v4 maintenance, this fork can wind down. If a future Monica
  successor ships with a working v4 data importer, this fork can wind
  down. We would welcome either outcome.

## Scope

In rough priority order, the things we plan to do:

1. Continued security patches against the current dependency graph
   (`composer audit` and `yarn audit` reduction)
2. Triage of the imported issue and PR queue, cherry-picking valuable
   community contributions that were never merged upstream
3. Continuing the internal modernization of the frontend layer:
   dropping Bootstrap 4 + jQuery in favour of Tachyons; finishing
   the TypeScript adoption on the shared `.js` modules. The
   Composition API conversion landed in PRs #798 (pilot) and #805
   (bulk migration of the remaining 78 SFCs). Constraint: zero
   user-facing behaviour change.

Already landed in the modernization ladder:

- PHP 8.4 compatibility
- Modern Laravel (currently 12.x)
- Modern Node / build chain (Vite 8 + `@vitejs/plugin-vue` 6)
- Vue 2.7 → Vue 3.5 cutover, including the surrounding plugin swaps
  (vue-i18n composition mode, `vue-final-modal`, `@vuelidate/core`,
  `@vuepic/vue-datepicker`, `@vueform/multiselect`, `floating-vue`,
  `@kyvg/vue3-notification`)
- Composition API + TypeScript on all 82 Vue SFCs (`<script setup
  lang="ts">`), with a small `resources/js/api/` helpers module
  owning the Laravel envelope shapes and a `toolFloors.typescript`
  CI guard pinning the minimum TS version

Things we will not do:

- New features beyond what is needed to keep existing functionality
  working on modern infrastructure
- UI redesigns or changes to user-facing behaviour
- Full-SPA conversion — the Blade-rendered pages with Vue-component
  islands architecture stays
- Forking the name, the docs, the marketing site, or the hosted product

For specific in/out decisions that aren't obvious from the code (e.g. which
OAuth grant types are supported), see [`docs/design-decisions.md`](docs/design-decisions.md).

## Status

**Early-stage. Do not use this fork in production yet.** This README will be
updated when the first usable tagged release is available. Until then, run
upstream v4.1.2 if you need a Monica deployment today.

## Provenance

- **Code:** forked from
  [`monicahq/monica`](https://github.com/monicahq/monica). The default branch
  here is `4.x`, pinned to the v4.1.2 release commit
  ([`32028ce`](https://github.com/monicahq/monica/commit/32028ce)). All other
  upstream branches and tags are preserved as-is for historical reference.
- **Issues:** imported from upstream. Bug reports and unclassified items
  live in [Issues](../../issues); feature requests and ideas live in
  [Discussions / Ideas](../../discussions/categories/ideas) (sortable by
  upvote); support questions live in
  [Discussions / Q&A](../../discussions/categories/q-a). Every imported
  item carries an `imported` label and a `scope:v4` / `scope:v5` /
  `scope:unknown` tag, plus a header crediting the original author and
  linking back to the upstream item.
- **Pull requests:** community PRs from upstream are preserved here.
  Those filed from contributor forks are reopened against this repo with
  their branches restored; the rest (mostly dependabot churn) are
  archived as issues with a `[PR]` prefix.
- **License:** AGPL-3.0-or-later, inherited from upstream. All upstream
  copyright notices are preserved.

## Acknowledgements

To [@djaiss](https://github.com/djaiss) and
[@asbiin](https://github.com/asbiin): thank you. Monica is a remarkable
piece of software, and the candour [@djaiss showed about the difficulty
of maintaining it][burnout-comment] is the reason this fork is framed
the way it is. We hope it's a help rather than a burden.

[burnout-comment]: https://github.com/monicahq/monica/issues/6626#issuecomment-2002484416

## Contributing

This is currently a quiet maintenance effort and isn't actively soliciting
contributors. If you stumble across this repo and want to help, please
open an issue introducing yourself. We will get to it.

## License

[AGPL-3.0-or-later](LICENSE) — same as upstream.
