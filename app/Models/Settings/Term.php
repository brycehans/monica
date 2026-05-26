<?php

namespace App\Models\Settings;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $term_version
 * @property string $term_content
 * @property string $privacy_version
 * @property string $privacy_content
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $users
 * @property-read int|null $users_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term wherePrivacyContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term wherePrivacyVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term whereTermContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term whereTermVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Term whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Term extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Get the user record associated with the term.
     */
    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('user_id')->withTimestamps();
    }
}
