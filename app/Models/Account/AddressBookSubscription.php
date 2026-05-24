<?php

namespace App\Models\Account;

use App\Traits\HasUuid;
use App\Models\User\User;
use function safe\json_decode;
use function safe\json_encode;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Builder;
use App\Services\DavClient\Utils\Dav\DavClient;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $user_id
 * @property int $address_book_id
 * @property string $name
 * @property string $uri
 * @property string $username
 * @property string $password
 * @property bool $readonly
 * @property bool $active
 * @property array $capabilities
 * @property string|null $syncToken
 * @property int|null $localSyncToken
 * @property int $frequency
 * @property \Illuminate\Support\Carbon|null $last_synchronized_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read \App\Models\Account\AddressBook $addressBook
 * @property-read User $user
 * @method static Builder<static>|AddressBookSubscription active()
 * @method static \Database\Factories\Account\AddressBookSubscriptionFactory factory($count = null, $state = [])
 * @method static Builder<static>|AddressBookSubscription newModelQuery()
 * @method static Builder<static>|AddressBookSubscription newQuery()
 * @method static Builder<static>|AddressBookSubscription query()
 * @method static Builder<static>|AddressBookSubscription whereAccountId($value)
 * @method static Builder<static>|AddressBookSubscription whereActive($value)
 * @method static Builder<static>|AddressBookSubscription whereAddressBookId($value)
 * @method static Builder<static>|AddressBookSubscription whereCapabilities($value)
 * @method static Builder<static>|AddressBookSubscription whereCreatedAt($value)
 * @method static Builder<static>|AddressBookSubscription whereFrequency($value)
 * @method static Builder<static>|AddressBookSubscription whereId($value)
 * @method static Builder<static>|AddressBookSubscription whereLastSynchronizedAt($value)
 * @method static Builder<static>|AddressBookSubscription whereLocalSyncToken($value)
 * @method static Builder<static>|AddressBookSubscription whereName($value)
 * @method static Builder<static>|AddressBookSubscription wherePassword($value)
 * @method static Builder<static>|AddressBookSubscription whereReadonly($value)
 * @method static Builder<static>|AddressBookSubscription whereSyncToken($value)
 * @method static Builder<static>|AddressBookSubscription whereUpdatedAt($value)
 * @method static Builder<static>|AddressBookSubscription whereUri($value)
 * @method static Builder<static>|AddressBookSubscription whereUserId($value)
 * @method static Builder<static>|AddressBookSubscription whereUsername($value)
 * @method static Builder<static>|AddressBookSubscription whereUuid($value)
 * @mixin \Eloquent
 */
class AddressBookSubscription extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'addressbook_subscriptions';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'user_id',
        'address_book_id',
        'name',
        'uri',
        'capabilities',
        'username',
        'password',
        'readonly',
        'syncToken',
        'localSyncToken',
        'frequency',
        'last_synchronized_at',
        'active',
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'readonly' => 'boolean',
        'active' => 'boolean',
        'localSyncToken' => 'integer',
        'last_synchronized_at' => 'datetime',
    ];

    /**
     * Eager load account with every contact.
     *
     * @var array<int, string>
     */
    protected $with = [
        'user',
    ];

    /**
     * Get the account record associated with the subscription.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user record associated with the subscription.
     *
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the addressbook record associated with the subscription.
     *
     * @return BelongsTo
     */
    public function addressBook()
    {
        return $this->belongsTo(AddressBook::class);
    }

    /**
     * Get capabilities.
     *
     * @param  string  $value
     * @return array
     */
    public function getCapabilitiesAttribute($value)
    {
        return json_decode($value, true);
    }

    /**
     * Set capabilities.
     *
     * @param  string  $value
     * @return void
     */
    public function setCapabilitiesAttribute($value)
    {
        $this->attributes['capabilities'] = json_encode($value);
    }

    /**
     * Get password.
     *
     * @param  string  $value
     * @return string
     */
    public function getPasswordAttribute($value)
    {
        return decrypt($value);
    }

    /**
     * Set password.
     *
     * @param  string  $value
     * @return void
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = encrypt($value);
    }

    /**
     * Scope a query to only include active subscriptions.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeActive($query)
    {
        return $query->where('active', 1);
    }

    /**
     * Get a new client.
     *
     * @return DavClient
     */
    public function getClient(): DavClient
    {
        return app(DavClient::class)
            ->setBaseUri($this->uri)
            ->setCredentials($this->username, $this->password);
    }
}
