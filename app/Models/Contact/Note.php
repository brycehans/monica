<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Helpers\DateHelper;
use App\Models\Account\Account;
use Illuminate\Database\Eloquent\Builder;
use App\Models\ModelBindingWithContact as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Account $account
 * @property Contact $contact
 * @property string $parsed_body
 * @property string $body
 * @property bool $is_favorited
 * @property \Illuminate\Support\Carbon|null $favorited_at
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static Builder<static>|Note favorited()
 * @method static Builder<static>|Note newModelQuery()
 * @method static Builder<static>|Note newQuery()
 * @method static Builder<static>|Note query()
 * @method static Builder<static>|Note whereAccountId($value)
 * @method static Builder<static>|Note whereBody($value)
 * @method static Builder<static>|Note whereContactId($value)
 * @method static Builder<static>|Note whereCreatedAt($value)
 * @method static Builder<static>|Note whereFavoritedAt($value)
 * @method static Builder<static>|Note whereId($value)
 * @method static Builder<static>|Note whereIsFavorited($value)
 * @method static Builder<static>|Note whereUpdatedAt($value)
 * @method static Builder<static>|Note whereUuid($value)
 * @mixin \Eloquent
 */
class Note extends Model
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
        'is_favorited' => 'boolean',
        'favorited_at' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'contact_id',
        'body',
        'is_favorited',
    ];

    /**
     * Eager load with every note.
     */
    protected $with = [
        'account',
        'contact',
    ];

    /**
     * Get the account record associated with the note.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the note.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Limit notes to favorited ones.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeFavorited(Builder $query)
    {
        return $query->where('is_favorited', true);
    }

    /**
     * Get the description of a note.
     *
     * @return string
     */
    public function getBody()
    {
        return $this->body;
    }

    /**
     * Gets the activity date for this note.
     *
     * @return string
     */
    public function getCreatedAt()
    {
        return DateHelper::getShortDate($this->created_at);
    }

    /**
     * Gets the content of the activity and formats it for the email.
     *
     * @return string
     */
    public function getContent()
    {
        return wordwrap($this->getBody(), 75);
    }
}
