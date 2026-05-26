<?php

namespace App\Models\Instance\Emotion;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An emotion (ex: Adoration) is defined into 3 categories:
 * - Primary: Love
 * - Secondary: Affection
 * - Tertiary: Adoration.
 *
 * @property int $id
 * @property int $emotion_primary_id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Instance\Emotion\Emotion> $emotions
 * @property-read int|null $emotions_count
 * @property-read \App\Models\Instance\Emotion\PrimaryEmotion $primary
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion whereEmotionPrimaryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SecondaryEmotion whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class SecondaryEmotion extends Model
{
    protected $table = 'emotions_secondary';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Get the primary emotion record associated with the secondary emotion.
     *
     * @return BelongsTo
     */
    public function primary()
    {
        return $this->belongsTo(PrimaryEmotion::class, 'emotion_primary_id');
    }

    /**
     * Get the emotion records associated with the secondary emotion.
     *
     * @return HasMany
     */
    public function emotions()
    {
        return $this->hasMany(Emotion::class);
    }
}
