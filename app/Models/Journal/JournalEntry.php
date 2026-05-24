<?php

namespace App\Models\Journal;

use App\Helpers\DateHelper;
use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Builder;
use App\Interfaces\IsJournalableInterface;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property Account $account
 * @property User $invitedBy
 * @property int $account_id
 * @property IsJournalableInterface $journalable
 * @property int $journalable_id
 * @property string $journalable_type
 * @property \Carbon\Carbon|null $date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static Builder<static>|JournalEntry entry()
 * @method static Builder<static>|JournalEntry newModelQuery()
 * @method static Builder<static>|JournalEntry newQuery()
 * @method static Builder<static>|JournalEntry query()
 * @method static Builder<static>|JournalEntry whereAccountId($value)
 * @method static Builder<static>|JournalEntry whereCreatedAt($value)
 * @method static Builder<static>|JournalEntry whereDate($value)
 * @method static Builder<static>|JournalEntry whereId($value)
 * @method static Builder<static>|JournalEntry whereJournalableId($value)
 * @method static Builder<static>|JournalEntry whereJournalableType($value)
 * @method static Builder<static>|JournalEntry whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class JournalEntry extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    protected $table = 'journal_entries';

    protected $casts = [
        'date' => 'datetime',
    ];

    /**
     * Eager load with every entry.
     */
    protected $with = [
        'journalable',
    ];

    /**
     * Get all of the owning "journal-able" models.
     *
     * @return MorphTo
     */
    public function journalable()
    {
        return $this->morphTo();
    }

    /**
     * Get the account record associated with the journal entry.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Adds a new entry in the journal.
     *
     * @param  \App\Interfaces\IsJournalableInterface  $resourceToLog
     * @return self
     */
    public static function add(IsJournalableInterface $resourceToLog): self
    {
        $journal = new self;
        $journal->account_id = $resourceToLog->account_id;
        $journal->date = now(DateHelper::getTimezone());
        if ($resourceToLog instanceof \App\Models\Account\Activity) {
            $journal->date = $resourceToLog->happened_at;
        } elseif ($resourceToLog instanceof \App\Models\Journal\Entry) {
            $journal->date = $resourceToLog->attributes['date'];
        }
        $journal->save();
        $resourceToLog->journalEntries()->save($journal);

        return $journal;
    }

    /**
     * Update an entry in the journal.
     *
     * @param  \App\Interfaces\IsJournalableInterface  $resourceToLog
     * @return self
     */
    public function edit(IsJournalableInterface $resourceToLog): self
    {
        if ($resourceToLog instanceof \App\Models\Journal\Entry) {
            $this->date = $resourceToLog->attributes['date'];
        }
        $this->save();

        return $this;
    }

    /**
     * Get the information about the object represented by the Journal Entry.
     *
     * @return array
     */
    public function getObjectData()
    {
        // Instantiating the object
        /** @var IsJournalableInterface */
        $correspondingObject = $this->journalable;

        return $correspondingObject->getInfoForJournalEntry();
    }

    /**
     * Filter by real entry (day rate or journal entry).
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeEntry(Builder $query): Builder
    {
        return $query->where('journalable_type', '!=', 'App\Models\Account\Activity');
    }
}
