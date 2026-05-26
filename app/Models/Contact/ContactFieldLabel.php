<?php

namespace App\Models\Contact;

use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $label
 * @property string $label_i18n
 * @property int $id
 * @property int $account_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereLabelI18n($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactFieldLabel whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class ContactFieldLabel extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    protected $table = 'contact_field_labels';

    /** @var array<string> */
    public static $standardLabels = [
        'home',
        'work',
        'cell',
        'fax',
        'pager',
        'main',
        'other',
    ];

    /**
     * Get the account record associated with the contact field type.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
