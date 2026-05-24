<?php

namespace App\Models\Instance;

use App\Models\User\User;
use function Safe\json_decode;
use App\Models\Account\Account;
use App\Models\Contact\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $account_id
 * @property int|null $author_id
 * @property int|null $about_contact_id
 * @property string $author_name
 * @property string $action
 * @property string $objects
 * @property \Illuminate\Support\Carbon $audited_at
 * @property bool $should_appear_on_dashboard
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read User|null $author
 * @property-read Contact|null $contact
 * @property-read mixed $object
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAboutContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAction($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAuditedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAuthorId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAuthorName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereObjects($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereShouldAppearOnDashboard($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class AuditLog extends Model
{
    protected $table = 'audit_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'author_id',
        'about_contact_id',
        'author_name',
        'action',
        'objects',
        'should_appear_on_dashboard',
        'audited_at',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'should_appear_on_dashboard' => 'boolean',
        'audited_at' => 'datetime',
    ];

    /**
     * Get the Account record associated with the audit log.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the User record associated with the audit log.
     *
     * @return BelongsTo
     */
    public function author()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the Contact record associated with the audit log.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class, 'about_contact_id');
    }

    /**
     * Get the JSON object.
     *
     * @param  mixed  $value
     * @return mixed
     */
    public function getObjectAttribute($value)
    {
        return json_decode($this->objects);
    }
}
