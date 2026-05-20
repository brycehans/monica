# Disabled workflows

These workflow files were inherited from `monicahq/monica` when this fork was
created. GitHub also disabled Actions on the fork itself at that point, with
the warning:

> Because this repository contained workflow files when it was forked, we have
> disabled them from running on this fork. Make sure you understand the
> configured workflows and their expected usage before enabling Actions on
> this repository.

That's a sensible default. Several of these workflows have fork-hostile
assumptions baked in:

- `docker.yml` pushes images to `ghcr.io/monicahq/monica` and depends on
  `CR_USER` / `CR_PAT` secrets that don't exist in this fork.
- `deploy.yml` and `release.yml` carry monicahq-specific deployment and
  semantic-release wiring that was never audited for a maintenance fork.
- `calibreapp-image-actions.yml` is a bot integration that needs its own
  account/install before it would do anything useful.

The rest (`build.yml`, `cypress.yml`, `migration_tests.yml`, `static.yml`,
`tests.yml`, `lock.yml`, `semantic.yml`) probably work as-is but haven't
been verified against the fork's PR path and merge model.

GitHub only picks up workflow files under `.github/workflows/`. Files in
this directory will not run, which is the point — they're parked here
until someone audits each one and either restores it (move back to
`.github/workflows/`, adjust as needed) or deletes it.

The only currently-live workflow is `.github/workflows/docker-dev.yml`,
which guards out-of-the-box buildability of the dev Docker image. See
issue #584 for context.

Tracking issue for restoring (or deleting) the workflows in this folder:
**see the fork's issue tracker.**
