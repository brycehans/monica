<?php

namespace App\Models\Instance;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $uuid
 * @property string $current_version
 * @property string|null $latest_version
 * @property string|null $latest_release_notes
 * @property int|null $number_of_versions_since_current_version
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereCurrentVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereLatestReleaseNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereLatestVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereNumberOfVersionsSinceCurrentVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Instance whereUuid($value)
 * @mixin \Eloquent
 */
class Instance extends Model
{
    /**
     * Once migrations have been run to add a new default contact field type,
     * we need to mark the field as being migrated so we don't create another
     * default contact field type if another migration will change this table
     * in the future.
     */
    public function markDefaultContactFieldTypeAsMigrated()
    {
        DB::table('default_contact_field_types')
            ->update(['migrated' => 1]);
    }
}
