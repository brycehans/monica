<?php

namespace App\Models\Account;

use App\Traits\HasUuid;
use App\Helpers\StorageHelper;
use App\Models\Contact\Contact;
use App\Models\ModelBinding as Model;
use Intervention\Image\ImageManager;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property string $original_filename
 * @property string $new_filename
 * @property int|null $filesize
 * @property string|null $mime_type
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Account\Account $account
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Contact> $contacts
 * @property-read int|null $contacts_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereFilesize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereNewFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereOriginalFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Photo whereUuid($value)
 * @mixin \Eloquent
 */
class Photo extends Model
{
    use HasUuid;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'photos';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = ['id'];

    /**
     * Get the account record associated with the photo.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contacts record associated with the photo.
     *
     * @return BelongsToMany
     */
    public function contacts()
    {
        return $this->belongsToMany(Contact::class)->withTimestamps();
    }

    /**
     * Get the first contact record associated with the photo.
     *
     * @return Contact
     */
    public function contact()
    {
        return $this->contacts->first();
    }

    /**
     * Gets the full path of the photo.
     *
     * @return string
     */
    public function url()
    {
        if (config('filesystems.default_visibility') === 'public') {
            return asset(StorageHelper::disk(config('filesystems.default'))->url($this->new_filename));
        }

        return route('storage', ['file' => $this->new_filename]);
    }

    /**
     * Gets the data-url format of the photo.
     *
     * @return string|null
     */
    public function dataUrl(): ?string
    {
        try {
            $url = $this->new_filename;
            $file = StorageHelper::disk(config('filesystems.default'))->get($url);

            return ImageManager::gd()->read($file)->encode()->toDataUri();
        } catch (FileNotFoundException $e) {
            return null;
        }
    }

    /**
     * Delete the model from the database.
     *
     * @return bool|null
     */
    public function delete()
    {
        try {
            Storage::disk(config('filesystems.default'))
                ->delete($this->new_filename);
        } catch (FileNotFoundException $e) {
            // continue
        }

        return parent::delete();
    }
}
