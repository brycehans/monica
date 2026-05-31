-- Auto-create the testing database referenced by .env.dev (DB_TEST_DATABASE=monica_test).
-- Mounted into mysql:8.0 at /docker-entrypoint-initdb.d/init.sql; runs once on first
-- volume init. Without this, `docker exec monica-app-1 yarn run test` errors with
-- "1146 Table 'monica_test.accounts' doesn't exist" because the testing connection
-- has nowhere to migrate.
CREATE DATABASE IF NOT EXISTS monica_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON monica_test.* TO 'homestead'@'%';

FLUSH PRIVILEGES;
