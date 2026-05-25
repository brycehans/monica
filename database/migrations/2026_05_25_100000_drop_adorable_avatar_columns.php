<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

/**
 * Retire the Adorable avatar feature.
 *
 * The asbiin/laravel-adorable package was dropped (composer remove) — see PR #7941
 * upstream and our follow-on D₀ on the L11 → L12 sub-ladder. The backing service
 * (avatars.adorable.io) has been dead since ~2020 and the package itself has had
 * no meaningful commits since March 2024.
 *
 * Up: migrate any existing contacts off the retired source, then drop the two
 * columns that backed it. Down restores the columns but NOT the data — the
 * UUIDs are discarded. Acceptable for a feature retire of a dead service.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Migrate existing rows away from the retired source first.
        DB::table('contacts')
            ->where('avatar_source', 'adorable')
            ->update(['avatar_source' => 'default']);

        if (Schema::hasColumn('contacts', 'avatar_adorable_uuid')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropColumn('avatar_adorable_uuid');
            });
        }

        if (Schema::hasColumn('contacts', 'avatar_adorable_url')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropColumn('avatar_adorable_url');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('contacts', 'avatar_adorable_uuid')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->uuid('avatar_adorable_uuid')->after('avatar_gravatar_url')->nullable();
            });
        }

        if (! Schema::hasColumn('contacts', 'avatar_adorable_url')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->string('avatar_adorable_url', 250)->after('avatar_adorable_uuid')->nullable();
            });
        }
        // NOTE: down() does not restore the original avatar_source values
        // for contacts that were on 'adorable' — those are lost on up().
    }
};
