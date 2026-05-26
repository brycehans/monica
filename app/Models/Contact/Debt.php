<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Models\Account\Account;
use App\Traits\AmountFormatter;
use App\Models\Settings\Currency;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\ModelBindingHasherWithContact as Model;

/**
 * @property Account $account
 * @property Contact $contact
 * @property int $amount
 * @method static Builder due()
 * @method static Builder owed()
 * @method static Builder inProgress()
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property string $in_debt
 * @property string $status
 * @property int|null $currency_id
 * @property string|null $reason
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Currency|null $currency
 * @property-read string $display_value
 * @property-read string $value
 * @method static Builder<static>|Debt newModelQuery()
 * @method static Builder<static>|Debt newQuery()
 * @method static Builder<static>|Debt query()
 * @method static Builder<static>|Debt whereAccountId($value)
 * @method static Builder<static>|Debt whereAmount($value)
 * @method static Builder<static>|Debt whereContactId($value)
 * @method static Builder<static>|Debt whereCreatedAt($value)
 * @method static Builder<static>|Debt whereCurrencyId($value)
 * @method static Builder<static>|Debt whereId($value)
 * @method static Builder<static>|Debt whereInDebt($value)
 * @method static Builder<static>|Debt whereReason($value)
 * @method static Builder<static>|Debt whereStatus($value)
 * @method static Builder<static>|Debt whereUpdatedAt($value)
 * @method static Builder<static>|Debt whereUuid($value)
 * @mixin \Eloquent
 */
class Debt extends Model
{
    use AmountFormatter, HasUuid;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Eager load with every debt.
     */
    protected $with = [
        'account',
        'contact',
    ];

    /**
     * Get the account record associated with the debt.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the debt.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the currency record associated with the debt.
     *
     * @return BelongsTo
     */
    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Limit results to unpaid/unreceived debt.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeInProgress(Builder $query)
    {
        return $query->where('status', 'inprogress');
    }

    /**
     * Limit results to due debt.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeDue(Builder $query)
    {
        return $query->where('in_debt', 'yes');
    }

    /**
     * Limit results to owed debt.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeOwed(Builder $query)
    {
        return $query->where('in_debt', 'no');
    }
}
