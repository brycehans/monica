<?php

namespace App\Models\Instance;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $command
 * @property \Illuminate\Support\Carbon $last_run
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron whereCommand($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron whereLastRun($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cron whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Cron extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'command',
        'last_run',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_run' => 'datetime',
    ];
}
