<?php

namespace App\Models\Instance\Emotion;

use App\Models\Contact\Call;
use App\Models\Account\Activity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * An emotion (ex: Adoration) is defined into 3 categories:
 * - Primary: Love
 * - Secondary: Affection
 * - Tertiary: Adoration.
 *
 * @property int $id
 * @property int $emotion_primary_id
 * @property int $emotion_secondary_id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Activity> $activities
 * @property-read int|null $activities_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Call> $calls
 * @property-read int|null $calls_count
 * @property-read \App\Models\Instance\Emotion\PrimaryEmotion $primary
 * @property-read \App\Models\Instance\Emotion\SecondaryEmotion $secondary
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereEmotionPrimaryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereEmotionSecondaryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Emotion whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Emotion extends Model
{
    protected $table = 'emotions';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * Get the primary emotion record associated with the emotion.
     *
     * @return BelongsTo
     */
    public function primary()
    {
        return $this->belongsTo(PrimaryEmotion::class, 'emotion_primary_id');
    }

    /**
     * Get the secondary emotion record associated with the emotion.
     *
     * @return BelongsTo
     */
    public function secondary()
    {
        return $this->belongsTo(SecondaryEmotion::class, 'emotion_secondary_id');
    }

    /**
     * Get the call records associated with the emotion.
     *
     * @return BelongsToMany
     */
    public function calls()
    {
        return $this->belongsToMany(Call::class, 'emotion_call', 'emotion_id', 'call_id')
            ->withPivot('account_id', 'contact_id')
            ->withTimestamps();
    }

    /**
     * Get the activity records associated with the emotion.
     *
     * @return BelongsToMany
     */
    public function activities()
    {
        return $this->belongsToMany(Activity::class, 'emotion_activity', 'emotion_id', 'activity_id')
            ->withPivot('account_id')
            ->withTimestamps();
    }
}
