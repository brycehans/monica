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
 * @property string $name
 * @property string|null $translation_key
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Account\ActivityType> $activityTypes
 * @property-read int|null $activity_types_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereTranslationKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityTypeCategory whereUuid($value)
 * @mixin \Eloquent
 */
class ActivityTypeCategory extends Model
{
    use HasUuid;

    protected $table = 'activity_type_categories';

    protected $appends = ['name'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'translation_key',
        'account_id',
    ];

    /**
     * Get the account record associated with the activity type group.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the activity type records associated with the category.
     *
     * @return HasMany
     */
    public function activityTypes()
    {
        return $this->hasMany(ActivityType::class);
    }

    /**
     * Get the activity type category's attribute.
     *
     * @return string
     * @psalm-suppress InvalidReturnStatement
     */
    public function getNameAttribute($value)
    {
        if ($this->translation_key && ! $value) {
            return trans('people.activity_type_category_'.$this->translation_key);
        }

        return $value;
    }
}
