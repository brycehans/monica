<?php

namespace App\Models\Account;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Account $account
 * @property int $account_id
 * @property User $user
 * @property int $user_id
 * @property int $import_job_id
 * @property string $contact_information
 * @property bool $skipped
 * @property string $skip_reason
 * @property int $id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\ImportJob $importJob
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereContactInformation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereImportJobId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereSkipReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereSkipped($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ImportJobReport whereUserId($value)
 * @mixin \Eloquent
 */
class ImportJobReport extends Model
{
    protected $table = 'import_job_reports';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * Get the account record associated with the import job report.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user record associated with the import job report.
     *
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the import job record associated with the gift.
     *
     * @return BelongsTo
     */
    public function importJob()
    {
        return $this->belongsTo(ImportJob::class);
    }
}
