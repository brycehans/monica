<?php

namespace App\Models\Account;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Account $account
 * @property User $invitedBy
 * @property string $invitation_key
 * @property int $id
 * @property int $account_id
 * @property int $invited_by_user_id
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereInvitationKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereInvitedByUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Invitation whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Invitation extends Model
{
    use Notifiable;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Get the account record associated with the invitation.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the task.
     *
     * @return BelongsTo
     */
    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}
