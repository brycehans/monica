<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cashier 16 introduced two new columns on subscription_items:
 *  - meter_id (after stripe_price)
 *  - meter_event_name (after quantity)
 *
 * Both are required by the Cashier 16 SubscriptionItem model and the
 * webhook handler. monica publishes the cashier migrations into its own
 * database/migrations/ tree (see 2020_11_01_000001_create_subscription_items_table.php
 * and 2022_04_25_165338_cashier_stripe_rename_plan.php), so the
 * 2025_06_06_* cashier-internal migrations are NOT auto-applied — we mirror
 * them here as a single fork-local migration.
 *
 * Mirrors vendor/laravel/cashier/database/migrations/2025_06_06_000004 + 000005.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_items', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_items', 'meter_id')) {
                $table->string('meter_id')->nullable()->after('stripe_price');
            }
            if (! Schema::hasColumn('subscription_items', 'meter_event_name')) {
                $table->string('meter_event_name')->nullable()->after('quantity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subscription_items', function (Blueprint $table) {
            if (Schema::hasColumn('subscription_items', 'meter_event_name')) {
                $table->dropColumn('meter_event_name');
            }
            if (Schema::hasColumn('subscription_items', 'meter_id')) {
                $table->dropColumn('meter_id');
            }
        });
    }
};
