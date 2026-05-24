<?php

namespace App\Models\Account;

use App\Traits\HasUuid;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $activity_type_category_id
 * @property string|null $name
 * @property string|null $translation_key
 * @property string|null $location_type
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Account\Activity> $activities
 * @property-read int|null $activities_count
 * @property-read \App\Models\Account\ActivityTypeCategory $category
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereActivityTypeCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereLocationType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereTranslationKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityType whereUuid($value)
 * @mixin \Eloquent
 */
class ActivityType extends Model
{
    use HasUuid;

    protected $table = 'activity_types';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'activity_type_category_id',
        'account_id',
        'translation_key',
    ];

    /**
     * Get the account record associated with the activity type.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the activity type category record associated with the activity types.
     *
     * @return BelongsTo
     */
    public function category()
    {
        return $this->belongsTo(ActivityTypeCategory::class, 'activity_type_category_id');
    }

    /**
     * Get the activity records associated with the activity type.
     *
     * @return HasMany
     */
    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Get the activity type's attribute.
     */
    public function getNameAttribute($value)
    {
        if ($this->translation_key && ! $value) {
            return trans('people.activity_type_'.$this->translation_key);
        }

        return $value;
    }

    /**
     * Reset all associated activities with this category type.
     *
     * @return void
     */
    public function resetAssociationWithActivities()
    {
        foreach ($this->activities as $activity) {
            $activity->activity_type_id = null;
            $activity->save();
        }
    }
}
