<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rename subscriptions.name → subscriptions.type for Cashier 15.
 *
 * Monica's subscriptions table was created with a `name` column
 * (2017_06_19_105842_add_stripe_fields_to_users.php — Cashier <12).
 * From Cashier 12+, the column has been called `type`; Cashier's reference
 * migration declares `$table->string('type')`. Cashier 15's
 * SubscriptionBuilder, the Billable concerns, and the Subscription model
 * all write/read `type` directly.
 *
 * When the fork bumped laravel/cashier ^14 → ^15 during the Laravel 11
 * modernization (commit 94f18e508), the companion `name → type` rename
 * migration was missed. The mismatch is silent until any code path tries
 * to persist a Subscription — which throws SQLSTATE[42S22] "Column not
 * found: 'type' in 'field list'".
 *
 * Forward-only rename — original column is repurposed, not duplicated,
 * preserving any existing row data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('name', 'type');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('type', 'name');
        });
    }
};
