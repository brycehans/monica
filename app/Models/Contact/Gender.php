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
 * @property string|null $type
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\Contact> $contacts
 * @property-read int|null $contacts_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Gender whereUuid($value)
 * @mixin \Eloquent
 */
class Gender extends Model
{
    use HasUuid;

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
        'type',
        'account_id',
    ];

    /**
     * Male type gender.
     *
     * @var string
     */
    public const MALE = 'M';

    /**
     * Female type gender.
     *
     * @var string
     */
    public const FEMALE = 'F';

    /**
     * Other type gender.
     *
     * @var string
     */
    public const OTHER = 'O';

    /**
     * Unknown type gender.
     *
     * @var string
     */
    public const UNKNOWN = 'U';

    /**
     * None type gender.
     *
     * @var string
     */
    public const NONE = 'N';

    public const LIST = ['M', 'F', 'O', 'U', 'N'];

    /**
     * Get the account record associated with the gender.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact records associated with the gender.
     *
     * @return HasMany
     */
    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    /**
     * Is this gender the default account one?.
     *
     * @return bool
     */
    public function isDefault(): bool
    {
        return $this->account->default_gender_id === $this->id;
    }
}
