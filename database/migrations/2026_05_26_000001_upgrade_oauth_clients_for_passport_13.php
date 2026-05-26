<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Passport 13 renames the columns on the `oauth_clients` table:
 *  - `user_id` (FK to users) → `owner_id` + `owner_type` (polymorphic morph)
 *  - `redirect` (single string) → `redirect_uris` (JSON list)
 *  - new `grant_types` (JSON list) column
 *  - `password_client` flag is no longer used (subsumed by grant_types)
 *
 * The id type is intentionally kept as bigint (with `Passport::$clientUuids = false`
 * set in AppServiceProvider) so existing client IDs and the tokens that point at
 * them remain valid. Per the Passport 13 upgrade guide:
 * https://github.com/laravel/passport/blob/13.x/UPGRADE.md#identify-clients-by-uuids
 *
 * `oauth_access_tokens.client_id` and `oauth_auth_codes.client_id` remain bigint
 * for the same reason. Passport 13 supports this configuration when `clientUuids`
 * is false.
 *
 * Existing client rows have their data migrated in-place — owner becomes
 * App\Models\User\User on the previously non-null user_id, redirect becomes a
 * single-element JSON array.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oauth_clients', function (Blueprint $table) {
            if (! Schema::hasColumn('oauth_clients', 'owner_id')) {
                $table->unsignedBigInteger('owner_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('oauth_clients', 'owner_type')) {
                $table->string('owner_type')->nullable()->after('owner_id');
            }
            if (! Schema::hasColumn('oauth_clients', 'redirect_uris')) {
                $table->text('redirect_uris')->nullable()->after('provider');
            }
            if (! Schema::hasColumn('oauth_clients', 'grant_types')) {
                $table->text('grant_types')->nullable()->after('redirect_uris');
            }
        });

        // Defensive defaults on the booleans that survive into the Passport 13 shape.
        // The original 2016 migration created `personal_access_client` and `revoked`
        // as NOT NULL with no default. Passport 13's ClientFactory writes them
        // explicitly, but `passport:client` / direct SQL inserts may not, and the
        // missing default would surface as `Field doesn't have a default value`.
        DB::statement('ALTER TABLE oauth_clients MODIFY personal_access_client TINYINT(1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE oauth_clients MODIFY revoked TINYINT(1) NOT NULL DEFAULT 0');

        // Migrate existing data: user_id → owner_id (morph to User model).
        if (Schema::hasColumn('oauth_clients', 'user_id')) {
            DB::table('oauth_clients')->whereNotNull('user_id')->update([
                'owner_id' => DB::raw('user_id'),
                // Hard-coded class string (not User::class import): per CLAUDE.md,
                // migrations must not depend on Eloquent models. A class-string is
                // the necessary minimum for the polymorphic owner_type column.
                'owner_type' => 'App\\Models\\User\\User',
            ]);
        }

        // Migrate legacy `redirect` (comma-separated string) → `redirect_uris`
        // (JSON array of separate elements). Passport historically allowed
        // multiple redirect URIs concatenated with commas; Passport 13 expects
        // them as discrete JSON array entries. JSON_ARRAY(`redirect`) would
        // wrap the whole string as one bogus element — split per-row in PHP.
        if (Schema::hasColumn('oauth_clients', 'redirect')) {
            DB::table('oauth_clients')
                ->select(['id', 'redirect'])
                ->whereNotNull('redirect')
                ->orderBy('id')
                ->each(function ($row) {
                    $uris = array_values(array_filter(array_map('trim', explode(',', $row->redirect))));
                    DB::table('oauth_clients')->where('id', $row->id)->update([
                        'redirect_uris' => json_encode($uris),
                    ]);
                });
        }

        // Default grant_types for existing rows that lack one.
        // Order matters — apply most specific first:
        //   1. personal-access clients → ['personal_access']
        //   2. password-grant clients (NOT personal-access) → ['password', 'refresh_token']
        //   3. everything else → ['authorization_code', 'refresh_token']
        //
        // The password-grant path is load-bearing: monica's API/mobile login uses
        // `password_grant_client` via OAuthController::proxy() (POSTs grant_type=password).
        // Lumping password clients into authorization_code+refresh_token would silently
        // break OAuth login on upgraded installs, because `password_client` is dropped
        // below and the original signal is lost.
        DB::table('oauth_clients')
            ->where('personal_access_client', true)
            ->whereNull('grant_types')
            ->update(['grant_types' => json_encode(['personal_access'])]);

        if (Schema::hasColumn('oauth_clients', 'password_client')) {
            DB::table('oauth_clients')
                ->where('password_client', true)
                ->where('personal_access_client', false)
                ->whereNull('grant_types')
                ->update(['grant_types' => json_encode(['password', 'refresh_token'])]);
        }

        DB::table('oauth_clients')
            ->whereNull('grant_types')
            ->update(['grant_types' => json_encode(['authorization_code', 'refresh_token'])]);

        // Drop the old columns now that data has been migrated.
        // No transaction wrap: MySQL implicitly commits DDL on every ALTER TABLE,
        // so wrapping would give false safety. Rerun-safety comes from the
        // Schema::hasColumn() guards above.
        Schema::table('oauth_clients', function (Blueprint $table) {
            if (Schema::hasColumn('oauth_clients', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('oauth_clients', 'redirect')) {
                $table->dropColumn('redirect');
            }
            if (Schema::hasColumn('oauth_clients', 'password_client')) {
                $table->dropColumn('password_client');
            }
        });

        // Add the owner morph index now that data is settled.
        Schema::table('oauth_clients', function (Blueprint $table) {
            if (! $this->indexExists('oauth_clients', 'oauth_clients_owner_type_owner_id_index')) {
                $table->index(['owner_type', 'owner_id']);
            }
        });
    }

    public function down(): void
    {
        // down() is best-effort: password_client boolean values were dropped in up()
        // and cannot be recovered. Non-User owner_type morphs (none exist today)
        // would also be orphaned on revert.
        Schema::table('oauth_clients', function (Blueprint $table) {
            if (! Schema::hasColumn('oauth_clients', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('oauth_clients', 'redirect')) {
                $table->text('redirect')->nullable();
            }
            if (! Schema::hasColumn('oauth_clients', 'password_client')) {
                $table->boolean('password_client')->default(false);
            }
        });

        if (Schema::hasColumn('oauth_clients', 'owner_id')) {
            DB::table('oauth_clients')
                ->whereNotNull('owner_id')
                ->update(['user_id' => DB::raw('owner_id')]);
        }

        Schema::table('oauth_clients', function (Blueprint $table) {
            if ($this->indexExists('oauth_clients', 'oauth_clients_owner_type_owner_id_index')) {
                $table->dropIndex(['owner_type', 'owner_id']);
            }
            if (Schema::hasColumn('oauth_clients', 'owner_id')) {
                $table->dropColumn('owner_id');
            }
            if (Schema::hasColumn('oauth_clients', 'owner_type')) {
                $table->dropColumn('owner_type');
            }
            if (Schema::hasColumn('oauth_clients', 'redirect_uris')) {
                $table->dropColumn('redirect_uris');
            }
            if (Schema::hasColumn('oauth_clients', 'grant_types')) {
                $table->dropColumn('grant_types');
            }
        });
    }

    private function indexExists(string $table, string $name): bool
    {
        $connection = Schema::getConnection();
        $schema = $connection->getDatabaseName();

        return collect($connection->select(
            'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
            [$schema, $table, $name],
        ))->isNotEmpty();
    }
};
