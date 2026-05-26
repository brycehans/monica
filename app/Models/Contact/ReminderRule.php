<?php

namespace App\Models\Contact;

use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $account_id
 * @property int $number_of_days_before
 * @property bool $active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereNumberOfDaysBefore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ReminderRule whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class ReminderRule extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    protected $table = 'reminder_rules';

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Get the account record associated with the reminder.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
