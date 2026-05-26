<?php

namespace App\Models\Account;

use App\Traits\HasUuid;
use App\Models\User\User;
use App\Models\Contact\Contact;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $user_id
 * @property string|null $description
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Contact> $contacts
 * @property-read int|null $contacts_count
 * @property-read User $user
 * @method static \Database\Factories\Account\AddressBookFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AddressBook whereUuid($value)
 * @mixin \Eloquent
 */
class AddressBook extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'addressbooks';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'user_id',
        'name',
        'description',
    ];

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
    ];

    /**
     * Get the account record associated with the address book.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user record associated with the address book.
     *
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all contacts for this address book.
     *
     * @return HasMany
     */
    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }
}
