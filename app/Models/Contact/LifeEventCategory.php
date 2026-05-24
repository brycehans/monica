<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property string $name
 * @property string|null $default_life_event_category_key
 * @property bool $core_monica_data
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\LifeEventType> $lifeEventTypes
 * @property-read int|null $life_event_types_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereCoreMonicaData($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereDefaultLifeEventCategoryKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventCategory whereUuid($value)
 * @mixin \Eloquent
 */
class LifeEventCategory extends Model
{
    use HasUuid;

    protected $table = 'life_event_categories';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'account_id',
        'default_life_event_category_key',
        'core_monica_data',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'core_monica_data' => 'boolean',
    ];

    /**
     * Get the account record associated with the life event category.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the life event type records associated with the category.
     *
     * @return HasMany
     */
    public function lifeEventTypes()
    {
        return $this->hasMany(LifeEventType::class);
    }
}
