<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Models\ModelBindingHasher as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property int $contact_field_type_id
 * @property \Illuminate\Support\Carbon $happened_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \App\Models\Contact\Contact|null $contact
 * @property-read \App\Models\Contact\ContactFieldType $contactFieldType
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\Message> $messages
 * @property-read int|null $messages_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereContactFieldTypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereHappenedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Conversation whereUuid($value)
 * @mixin \Eloquent
 */
class Conversation extends Model
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
        'happened_at' => 'datetime',
    ];

    /**
     * Get the account record associated with the conversation.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the conversation.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the contact field type record associated with the conversation.
     *
     * @return BelongsTo
     */
    public function contactFieldType()
    {
        return $this->belongsTo(ContactFieldType::class);
    }

    /**
     * Get the Message records associated with the conversation.
     *
     * @return HasMany
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
