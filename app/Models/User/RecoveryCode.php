<?php

namespace App\Models\User;

use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property int $account_id
 * @property int $user_id
 * @property string $recovery
 * @property int $used
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static Builder<static>|RecoveryCode newModelQuery()
 * @method static Builder<static>|RecoveryCode newQuery()
 * @method static Builder<static>|RecoveryCode query()
 * @method static Builder<static>|RecoveryCode unused()
 * @method static Builder<static>|RecoveryCode whereAccountId($value)
 * @method static Builder<static>|RecoveryCode whereCreatedAt($value)
 * @method static Builder<static>|RecoveryCode whereId($value)
 * @method static Builder<static>|RecoveryCode whereRecovery($value)
 * @method static Builder<static>|RecoveryCode whereUpdatedAt($value)
 * @method static Builder<static>|RecoveryCode whereUsed($value)
 * @method static Builder<static>|RecoveryCode whereUserId($value)
 * @mixin \Eloquent
 */
class RecoveryCode extends Model
{
    protected $table = 'recovery_codes';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'user_id',
        'recovery',
    ];

    /**
     * Scope a query to only include unused code.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeUnused($query)
    {
        return $query->where('used', 0);
    }
}
