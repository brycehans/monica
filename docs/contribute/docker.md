# Build Docker image for Monica

If you want to build your own docker image for Monica, follow these steps:

## Use docker-compose to build and run your own image

Use this process if you want to modify Monica source code and build
your image to run.

Edit `.env` to set `DB_HOST=mysql` (as `mysql` is the creative name of the MySQL container).

The dev compose mounts `./public/build:/var/www/html/public/build`, so the
container's Apache serves whatever the host last built. Run `yarn install`
+ `yarn run prod` on the host before bringing the stack up — otherwise the
mount overlays the image's baked-in assets with an empty directory and
every blade page 500s on the missing `manifest.json`. After the cold
start, `yarn run watch` rebuilds incrementally on file change.

```sh
yarn install
yarn run prod
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up
```

## Use Docker directly to run with your own database

Use this process if you're a developer and want complete control over
your Monica container.

If you aren't using docker-compose, edit `.env` again to set the `DB_*` variables to match your database. Then run:

```sh
scripts/docker/build.sh
```

You can add the tag name as a parameter:
```sh
scripts/docker/build.sh monica-dev
```

Run monica with:
```sh
docker run --env-file .env -p 80:80 monica-dev
```

Or run a command in the container:
```sh
docker run --env-file .env -it monica-dev bash
```

There's a bunch of [docker-compose examples here.](https://github.com/monicahq/docker/tree/master/.examples)

Note that uploaded files, like avatars, will disappear when you
restart the container. Map a volume to
`/var/www/monica/storage/app/public` if you want that data to persist
between runs. See `docker-compose.yml` for examples.

## Running PHPUnit inside the Docker dev stack

The dev stack runs tests directly inside the `app` container:

```sh
docker exec monica-app-1 yarn run migrate     # migrate + seed the testing DB
docker exec monica-app-1 vendor/bin/phpunit   # run the suite
```

`yarn run migrate` runs `php artisan migrate:fresh --seed` with `DB_CONNECTION=testing`, which reads the `DB_TEST_*` block from `.env.dev`. The default `.env.dev` points those at `mysql` (the Docker service name) and the `monica_test` database, both of which must exist:

```sh
docker exec monica-mysql-1 mysql -u root -psekret_root_password \
  -e "CREATE DATABASE IF NOT EXISTS monica_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; \
      GRANT ALL ON monica_test.* TO 'homestead'@'%';"
```

### Why `phpunit.xml` uses `force="true"` and a custom bootstrap

PHPUnit's `<env>` directive normally only writes to `putenv()` and `$_ENV`. It does **not** touch `$_SERVER`. When `docker compose` loads `env_file: .env.dev`, the container's `APP_ENV=local` lands in `$_SERVER`, and Laravel's `Env::get()` reads `$_SERVER` first — so `config('app.env')` returns `local` even when `phpunit.xml` says `testing`.

Symptoms when this is broken: feature tests get 302 redirects to `/` on every POST. CSRF middleware's `runningUnitTests()` check fails because `APP_ENV !== 'testing'`, `TokenMismatchException` fires, and the app's custom exception handler turns it into a redirect to `loginRedirect`.

Two pieces keep this working:

1. **`force="true"` on the critical `<env>` overrides in `phpunit.xml`** — `APP_ENV`, `APP_KEY`, `BCRYPT_ROUNDS`, `DB_CONNECTION`. Without it, PHPUnit's `<env>` is a no-op when the same name already exists in the process environment (which it does in Docker).
2. **`tests/bootstrap.php`** — runs after PHPUnit applies its `<env>` block and copies `$_ENV` over `$_SERVER` so Laravel's `Env::get()` sees the testing values.

If you ever see a wave of feature-test 302s after touching test config or the Docker stack, check `$_SERVER['APP_ENV']` inside a middleware before chasing it through the auth stack.

## Running Cypress against the Docker dev stack

`cy.exec()` always runs on the host shell, not inside the container. Set
`CYPRESS_USE_DOCKER=true` so that artisan commands are routed through
`docker exec` instead:

```sh
CYPRESS_USE_DOCKER=true CYPRESS_BASE_URL=http://localhost:8082 yarn run e2e
```

The project expects Node 20 for frontend tooling. If your shell is on another
Node version, run Cypress through your Node version manager, for example:

```sh
CYPRESS_USE_DOCKER=true CYPRESS_BASE_URL=http://localhost:8082 fnm exec --using=20 yarn run e2e
```

The container name defaults to `monica-app-1` (Docker Compose's default when
the working directory is named `monica`). Override it if your setup differs:

```sh
CYPRESS_USE_DOCKER=true CYPRESS_DOCKER_CONTAINER=myproject-app-1 CYPRESS_BASE_URL=http://localhost:8082 yarn run e2e
```

The helper also passes `--user www-data` so artisan runs as the same uid as
apache inside the container; without it, `storage/logs/laravel.log` gets
chowned to root and subsequent web requests 500 (see #629). Override via
`CYPRESS_DOCKER_USER` if your container uses a different user, or set it to
an empty string to run as root:

```sh
CYPRESS_USE_DOCKER=true CYPRESS_DOCKER_USER=appuser CYPRESS_BASE_URL=http://localhost:8082 yarn run e2e
```

## Other documents to read

[Connecting to MySQL inside of a Docker container](/docs/installation/docker-mysql.md)
[Use mobile app with standalone server](/docs/installation/mobile.md)
