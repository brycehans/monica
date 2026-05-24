<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property int $life_event_type_id
 * @property int|null $reminder_id
 * @property string|null $name
 * @property string|null $note
 * @property \Illuminate\Support\Carbon $happened_at
 * @property bool $happened_at_month_unknown
 * @property bool $happened_at_day_unknown
 * @property string|null $specific_information
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \App\Models\Contact\Contact|null $contact
 * @property-read \App\Models\Contact\LifeEventType $lifeEventType
 * @property-read \App\Models\Contact\Reminder|null $reminder
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereHappenedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereHappenedAtDayUnknown($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereHappenedAtMonthUnknown($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereLifeEventTypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereNote($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereReminderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereSpecificInformation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LifeEvent whereUuid($value)
 * @mixin \Eloquent
 */
class LifeEvent extends Model
{
    use HasUuid;

    protected $table = 'life_events';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'note',
        'happened_at',
        'account_id',
        'contact_id',
        'reminder_id',
        'life_event_type_id',
        'happened_at_month_unknown',
        'happened_at_day_unknown',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'happened_at_month_unknown' => 'boolean',
        'happened_at_day_unknown' => 'boolean',
        'happened_at' => 'datetime',
    ];

    /**
     * Get the account record associated with the life event.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the life event.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the life event type record associated with the life event.
     *
     * @return BelongsTo
     */
    public function lifeEventType()
    {
        return $this->belongsTo(LifeEventType::class, 'life_event_type_id');
    }

    /**
     * Get the reminder record associated with the life event.
     *
     * @return BelongsTo
     */
    public function reminder()
    {
        return $this->belongsTo(Reminder::class);
    }
}
