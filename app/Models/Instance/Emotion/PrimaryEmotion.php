<?php

namespace App\Models\Instance\Emotion;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An emotion (ex: Adoration) is defined into 3 categories:
 * - Primary: Love
 * - Secondary: Affection
 * - Tertiary: Adoration.
 *
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Instance\Emotion\Emotion> $emotions
 * @property-read int|null $emotions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Instance\Emotion\SecondaryEmotion> $secondaries
 * @property-read int|null $secondaries_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PrimaryEmotion whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class PrimaryEmotion extends Model
{
    protected $table = 'emotions_primary';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Get the emotion records associated with the primary emotion.
     *
     * @return HasMany
     */
    public function emotions()
    {
        return $this->hasMany(Emotion::class, 'emotion_primary_id');
    }

    /**
     * Get the secondary records associated with the primary emotion.
     *
     * @return HasMany
     */
    public function secondaries()
    {
        return $this->hasMany(SecondaryEmotion::class, 'emotion_primary_id');
    }
}
