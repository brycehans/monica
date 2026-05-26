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
 * @property string $name
 * @property string|null $fontawesome_icon
 * @property string|null $protocol
 * @property bool $delible
 * @property string|null $type
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\Conversation> $conversations
 * @property-read int|null $conversations_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereDelible($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereFontawesomeIcon($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereProtocol($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldType whereUuid($value)
 * @mixin \Eloquent
 */
class ContactFieldType extends Model
{
    use HasUuid;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    protected $table = 'contact_field_types';

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'delible' => 'boolean',
    ];

    /**
     * Email type contact field.
     *
     * @var string
     */
    public const EMAIL = 'email';

    /**
     * Phone type contact field.
     *
     * @var string
     */
    public const PHONE = 'phone';

    /**
     * Get the account record associated with the contact field type.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the conversations associated with the contact field type.
     *
     * @return HasMany
     */
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
