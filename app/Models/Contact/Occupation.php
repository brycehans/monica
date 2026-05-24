<?php

namespace App\Models\Contact;

use App\Models\Account\Account;
use App\Models\Account\Company;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $account_id
 * @property int $contact_id
 * @property int $company_id
 * @property string $title
 * @property string|null $description
 * @property int|null $salary
 * @property string|null $salary_unit
 * @property int|null $currently_works_here
 * @property \Illuminate\Support\Carbon|null $start_date
 * @property \Illuminate\Support\Carbon|null $end_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read Company $company
 * @property-read \App\Models\Contact\Contact|null $contact
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereCompanyId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereCurrentlyWorksHere($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereEndDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereSalary($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereSalaryUnit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereStartDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Occupation whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Occupation extends Model
{
    protected $table = 'occupations';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'contact_id',
        'company_id',
        'title',
        'description',
        'salary',
        'salary_unit',
        'currently_works_here',
        'start_date',
        'end_date',
    ];

    /**
     * Valid value for salary unit.
     *
     * @var array
     */
    public static $salaryUnits = [
        'year', 'month', 'week', 'day', 'hour',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'datetime:Y-m-d',
        'end_date' => 'datetime:Y-m-d',
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * Get the account record associated with the occupation.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the occupation.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the company record associated with the occupation.
     *
     * @return BelongsTo
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
