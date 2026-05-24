<?php

namespace App\Models\Journal;

use App\Traits\HasUuid;
use App\Helpers\DateHelper;
use App\Traits\Journalable;
use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use App\Interfaces\IsJournalableInterface;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property \Illuminate\Support\Carbon $date
 * @property int $rate
 * @property string|null $comment
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Journal\JournalEntry> $journalEntries
 * @property-read int|null $journal_entries_count
 * @property-read \App\Models\Journal\JournalEntry|null $journalEntry
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereComment($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereRate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Day whereUuid($value)
 * @mixin \Eloquent
 */
class Day extends Model implements IsJournalableInterface
{
    use Journalable, HasUuid;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'datetime',
    ];

    /**
     * Get the account record associated with the debt.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get all the information of the Entry for the journal.
     *
     * @return array
     */
    public function getInfoForJournalEntry()
    {
        return [
            'type' => 'day',
            'id' => $this->id,
            'rate' => $this->rate,
            'comment' => $this->comment,
            'date' => $this->date,
            'day' => $this->date->day,
            'day_name' => mb_convert_case(DateHelper::getShortDay($this->date), MB_CASE_TITLE, 'UTF-8'),
            'month' => $this->date->month,
            'month_name' => mb_convert_case(DateHelper::getShortMonth($this->date), MB_CASE_UPPER, 'UTF-8'),
            'year' => $this->date->year,
            'happens_today' => $this->date->isToday(),
        ];
    }
}
