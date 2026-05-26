<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Models\Instance\Emotion\Emotion;
use App\Models\ModelBindingWithContact as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property Contact $contact
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property \Illuminate\Support\Carbon $called_at
 * @property string|null $content
 * @property bool $contact_called
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Emotion> $emotions
 * @property-read int|null $emotions_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereCalledAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereContactCalled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Call whereUuid($value)
 * @mixin \Eloquent
 */
class Call extends Model
{
    use HasUuid;

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
        'contact_called' => 'boolean',
        'called_at' => 'datetime',
    ];

    /**
     * Eager load with every call.
     */
    protected $with = [
        'account',
        'contact',
    ];

    /**
     * Get the account record associated with the call.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the call.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the emotion records associated with the call.
     *
     * @return BelongsToMany
     */
    public function emotions()
    {
        return $this->belongsToMany(Emotion::class, 'emotion_call', 'call_id', 'emotion_id')
                    ->withPivot('account_id', 'contact_id')
                    ->withTimestamps();
    }
}
