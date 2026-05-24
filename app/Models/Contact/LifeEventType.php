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
 * @property int $life_event_category_id
 * @property string|null $name
 * @property string|null $default_life_event_type_key
 * @property bool $core_monica_data
 * @property string|null $specific_information_structure
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \App\Models\Contact\LifeEventCategory $lifeEventCategory
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\LifeEvent> $lifeEvents
 * @property-read int|null $life_events_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereCoreMonicaData($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereDefaultLifeEventTypeKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereLifeEventCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereSpecificInformationStructure($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEventType whereUuid($value)
 * @mixin \Eloquent
 */
class LifeEventType extends Model
{
    use HasUuid;

    protected $table = 'life_event_types';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'account_id',
        'life_event_category_id',
        'default_life_event_type_key',
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
     * Get the account record associated with the life event type.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the life event category record associated with the life event type.
     *
     * @return BelongsTo
     */
    public function lifeEventCategory()
    {
        return $this->belongsTo(LifeEventCategory::class, 'life_event_category_id');
    }

    /**
     * Get the Life event records associated with the life event Type.
     *
     * @return HasMany
     */
    public function lifeEvents()
    {
        return $this->hasMany(LifeEvent::class);
    }
}
