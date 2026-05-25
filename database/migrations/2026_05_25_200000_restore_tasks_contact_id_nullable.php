<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Restore tasks.contact_id nullable after L11 schema-builder regression.
 *
 * Migration 2018_11_15_172333_make_contact_id_nullable_in_tasks made the
 * column nullable. The later FK migration 2019_12_17_024553_add_foreign_keys
 * called `->unsignedInteger('contact_id')->change()` without `->nullable()`.
 *
 * Pre-Laravel 11 (doctrine/dbal-backed) `->change()` merged modifiers, so the
 * earlier nullable() stuck. Laravel 11's native schema builder replaces all
 * modifiers, so the same call silently resets the column to NOT NULL.
 *
 * This breaks any code path that creates a task without a contact (CalDAV
 * task imports, CreateTaskTest::it_stores_a_task_without_contact_id, etc.).
 *
 * Forward-only restore — old migrations are not modified.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedInteger('contact_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // No-op: the column was meant to be nullable from 2018 onward;
        // there is no meaningful "down" state to restore.
    }
};
