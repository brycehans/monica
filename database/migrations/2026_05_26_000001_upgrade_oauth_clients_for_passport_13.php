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

        // Migrate existing data: user_id → owner_id (morph to User model),
        // redirect → redirect_uris (wrapped in JSON list).
        if (Schema::hasColumn('oauth_clients', 'user_id')) {
            DB::table('oauth_clients')->whereNotNull('user_id')->update([
                'owner_id' => DB::raw('user_id'),
                'owner_type' => 'App\\Models\\User\\User',
            ]);
        }

        if (Schema::hasColumn('oauth_clients', 'redirect')) {
            // Wrap each existing redirect string into a JSON array.
            // Use the database's JSON_ARRAY function for portability.
            DB::table('oauth_clients')
                ->whereNotNull('redirect')
                ->update([
                    'redirect_uris' => DB::raw('JSON_ARRAY(`redirect`)'),
                ]);
        }

        // Default grant_types for any existing row that lacks one.
        // The closest analog to the previous behaviour is authorization_code
        // + refresh_token for non-personal clients; personal-access clients
        // get 'personal_access' to match the Factory.
        DB::table('oauth_clients')
            ->where('personal_access_client', true)
            ->whereNull('grant_types')
            ->update(['grant_types' => json_encode(['personal_access'])]);

        DB::table('oauth_clients')
            ->where('personal_access_client', false)
            ->whereNull('grant_types')
            ->update(['grant_types' => json_encode(['authorization_code', 'refresh_token'])]);

        // Drop the old columns now that data has been migrated.
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
