<?php

namespace App\Models\Contact;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property int $is_common
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory common()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory whereIsCommon($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PetCategory whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class PetCategory extends Model
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    protected $table = 'pet_categories';

    /**
     * Scope a query to only include pet categories that are considered `common`.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCommon($query)
    {
        return $query->where('is_common', 1);
    }
}
