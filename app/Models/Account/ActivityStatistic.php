<?php

namespace App\Models\Account;

use App\Models\Contact\Contact;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $account_id
 * @property int $contact_id
 * @property int $year
 * @property int $count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read Contact|null $contact
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityStatistic whereYear($value)
 * @mixin \Eloquent
 */
class ActivityStatistic extends Model
{
    protected $table = 'activity_statistics';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'contact_id',
        'year',
        'count',
    ];

    /**
     * Get the account record associated with the activity statistic.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the activity statistic.
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
