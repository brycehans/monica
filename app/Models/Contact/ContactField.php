<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Interfaces\LabelInterface;
use App\Models\ModelBindingWithContact as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property int $contact_field_type_id
 * @property string $data
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \App\Models\Contact\Contact|null $contact
 * @property-read \App\Models\Contact\ContactFieldType $contactFieldType
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contact\ContactFieldLabel> $labels
 * @property-read int|null $labels_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField email()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField phone()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereContactFieldTypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereData($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ContactField whereUuid($value)
 * @mixin \Eloquent
 */
class ContactField extends Model implements LabelInterface
{
    use HasUuid;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * All of the relationships to be touched.
     *
     * @var array
     */
    protected $touches = ['contact'];

    /**
     * Get the account record associated with the contact field.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the contact field.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the label associated with the contact.
     *
     * @return BelongsToMany
     */
    public function labels()
    {
        return $this->belongsToMany(ContactFieldLabel::class);
    }

    /**
     * Get the type associated with the contact field.
     *
     * @return BelongsTo
     */
    public function contactFieldType()
    {
        return $this->belongsTo(ContactFieldType::class);
    }

    /**
     * Scope a query to only include contact field of email type.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeEmail($query)
    {
        return $query->whereHas('contactFieldType', function ($query) {
            $query->where('type', '=', ContactFieldType::EMAIL);
        });
    }

    /**
     * Scope a query to only include contact field of phone type.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePhone($query)
    {
        return $query->whereHas('contactFieldType', function ($query) {
            $query->where('type', '=', ContactFieldType::PHONE);
        });
    }
}
