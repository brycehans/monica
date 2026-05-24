<?php

namespace App\Models\Relationship;

use App\Models\Account\Account;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $account_id
 * @property string $name
 * @property bool $delible
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereDelible($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelationshipTypeGroup whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class RelationshipTypeGroup extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    protected $table = 'relationship_type_groups';

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'delible' => 'boolean',
    ];

    /**
     * Get the account record associated with the reminder.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
