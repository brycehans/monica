<?php

namespace App\Models\Account;

use App\Traits\HasUuid;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;
use App\Notifications\ExportAccountDone;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $user_id
 * @property string $type
 * @property string|null $status
 * @property string|null $location
 * @property string|null $filename
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $ended_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read User $user
 * @method static \Database\Factories\Account\ExportJobFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereEndedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereStartedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExportJob whereUuid($value)
 * @mixin \Eloquent
 */
class ExportJob extends Model
{
    use HasUuid, HasFactory;

    public const EXPORT_TODO = 'todo';
    public const EXPORT_DOING = 'doing';
    public const EXPORT_DONE = 'done';
    public const EXPORT_FAILED = 'failed';

    /**
     * Export as SQL format.
     *
     * @var string
     */
    public const SQL = 'sql';

    /**
     * Export as JSON format.
     *
     * @var string
     */
    public const JSON = 'json';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'account_id',
        'user_id',
        'type',
        'status',
        'filesystem',
        'filename',
        'started_at',
        'ended_at',
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
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Get the account record associated with the import job.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user record associated with the import job.
     *
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Start the export job.
     *
     * @return void
     */
    public function start(): void
    {
        $this->status = self::EXPORT_DOING;
        $this->started_at = now();
        $this->save();
    }

    /**
     * End the export job.
     *
     * @return void
     */
    public function end(): void
    {
        $this->status = self::EXPORT_DONE;
        $this->ended_at = now();
        $this->save();

        $this->user->notify(new ExportAccountDone($this));
    }
}
