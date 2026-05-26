<?php

namespace App\Models\User;

use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A module is a section of information that appears in the Contact sheet, like
 * 'Activities' or 'Notes'.
 *
 * @property int $id
 * @property int $account_id
 * @property string $key
 * @property string $translation_key
 * @property bool $active
 * @property bool $delible
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereDelible($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereTranslationKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Module whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Module extends Model
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
        'active' => 'boolean',
        'delible' => 'boolean',
    ];

    /**
     * Get the account record associated with the module.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope a query to only include modules that are active.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
