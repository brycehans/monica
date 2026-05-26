<?php

namespace App\Models\Contact;

use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property Account $account
 * @property Contact|null $contact
 * @property string $title
 * @property string $description
 * @property string $uuid
 * @property bool $completed
 * @property \Carbon\Carbon|null $completed_at
 * @method static Builder completed()
 * @method static Builder inProgress()
 * @property int $account_id
 * @property int $contact_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static Builder<static>|Task newModelQuery()
 * @method static Builder<static>|Task newQuery()
 * @method static Builder<static>|Task query()
 * @method static Builder<static>|Task whereAccountId($value)
 * @method static Builder<static>|Task whereCompleted($value)
 * @method static Builder<static>|Task whereCompletedAt($value)
 * @method static Builder<static>|Task whereContactId($value)
 * @method static Builder<static>|Task whereCreatedAt($value)
 * @method static Builder<static>|Task whereDescription($value)
 * @method static Builder<static>|Task whereId($value)
 * @method static Builder<static>|Task whereTitle($value)
 * @method static Builder<static>|Task whereUpdatedAt($value)
 * @method static Builder<static>|Task whereUuid($value)
 * @mixin \Eloquent
 */
class Task extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'completed' => 'boolean',
        'archived' => 'boolean',
        'completed_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Eager load with every task.
     */
    protected $with = [
        'account',
        'contact',
    ];

    /**
     * Get the account record associated with the task.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the task.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Limit tasks to completed ones.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeCompleted(Builder $query)
    {
        return $query->where('completed', true);
    }

    /**
     * Limit tasks to in-progress ones.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeInProgress(Builder $query)
    {
        return $query->where('completed', false);
    }
}
