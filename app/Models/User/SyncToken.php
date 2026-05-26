<?php

namespace App\Models\User;

use App\Models\ModelBinding as Model;

/**
 * @property int $id
 * @property int $account_id
 * @property int $user_id
 * @property string $name
 * @property string $timestamp
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereTimestamp($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SyncToken whereUserId($value)
 * @mixin \Eloquent
 */
class SyncToken extends Model
{
    protected $table = 'synctoken';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'user_id',
        'name',
        'timestamp',
    ];
}
