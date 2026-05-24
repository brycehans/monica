<?php

namespace App\Models\Contact;

use App\Traits\HasUuid;
use App\Helpers\StorageHelper;
use App\Models\Account\Account;
use App\Models\ModelBinding as Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

/**
 * @property int $id
 * @property string $uuid
 * @property int $account_id
 * @property int $contact_id
 * @property string $original_filename
 * @property string $new_filename
 * @property int|null $filesize
 * @property string|null $type
 * @property string|null $mime_type
 * @property int $number_of_downloads
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Account $account
 * @property-read \App\Models\Contact\Contact|null $contact
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereAccountId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereContactId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFilesize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereNewFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereNumberOfDownloads($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereOriginalFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereUuid($value)
 * @mixin \Eloquent
 */
class Document extends Model
{
    use HasUuid;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'documents';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = ['id'];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'number_of_downloads' => 'integer',
    ];

    /**
     * Get the account record associated with the document.
     *
     * @return BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the contact record associated with the document.
     *
     * @return BelongsTo
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the download link.
     *
     * @return string
     */
    public function getDownloadLink(): string
    {
        if (config('filesystems.default_visibility') === 'public') {
            return asset(StorageHelper::disk(config('filesystems.default'))->url($this->new_filename));
        }

        return route('storage', ['file' => $this->new_filename]);
    }

    /**
     * Gets the data-url format of the document.
     *
     * @return string|null
     */
    public function dataUrl(): ?string
    {
        try {
            $url = $this->new_filename;
            $file = StorageHelper::disk(config('filesystems.default'))->get($url);

            return sprintf('data:%s;base64,%s',
                $this->mime_type,
                base64_encode($file)
            );
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
