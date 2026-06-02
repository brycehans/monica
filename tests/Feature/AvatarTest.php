<?php

namespace Tests\Feature;

use Tests\FeatureTestCase;
use App\Models\Account\Photo;
use App\Models\Contact\Contact;
use App\Models\Contact\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class AvatarTest extends FeatureTestCase
{
    use DatabaseTransactions;

    /**
     * Returns an array containing a user object along with
     * a contact for that user.
     *
     * @return array
     */
    private function fetchUser()
    {
        $user = $this->signIn();

        $contact = factory(Contact::class)->create([
            'account_id' => $user->account_id,
        ]);

        return [$user, $contact];
    }

    public function test_user_can_add_an_avatar_as_photo()
    {
        [$user, $contact] = $this->fetchUser();

        Storage::fake('public');
        $file = UploadedFile::fake()->image('avatar.jpg');

        $params = [
            'avatar' => 'upload',
            'photo' => $file,
        ];

        $response = $this->post('/people/'.$contact->hashID().'/avatar', $params);

        $response->assertStatus(302);

        // Assert the photo has been added for the correct user.
        $this->assertDatabaseHas('photos', [
            'account_id' => $user->account_id,
            'original_filename' => 'avatar.jpg',
            'new_filename' => 'photos/'.$file->hashName(),
        ]);
        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'account_id' => $user->account_id,
            'avatar_source' => 'photo',
        ]);
        $this->assertDatabaseHas('contact_photo', [
            'contact_id' => $contact->id,
        ]);

        Storage::disk('public')->assertExists('photos/'.$file->hashName());
    }

    public function test_user_can_associate_an_avatar_as_photo()
    {
        [$user, $contact] = $this->fetchUser();

        Storage::fake('public');
        $file = UploadedFile::fake()->image('avatar.jpg');

        $params = [
            'avatar' => 'upload',
            'photo' => $file,
        ];

        $response = $this->post('/people/'.$contact->hashID().'/avatar', $params);

        $response->assertStatus(302);

        $contact->refresh();
        $photo = $contact->photos->first();

        $contact2 = factory(Contact::class)->create([
            'account_id' => $user->account_id,
        ]);

        $response = $this->post('/people/'.$contact2->hashID().'/makeProfilePicture/'.$photo->id);

        // Assert the photo has been added for the correct user.
        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'account_id' => $user->account_id,
            'original_filename' => 'avatar.jpg',
            'new_filename' => 'photos/'.$file->hashName(),
        ]);
        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'account_id' => $user->account_id,
            'avatar_source' => 'photo',
        ]);
        $this->assertDatabaseHas('contacts', [
            'id' => $contact2->id,
            'account_id' => $user->account_id,
            'avatar_source' => 'photo',
        ]);
        $this->assertDatabaseHas('contact_photo', [
            'contact_id' => $contact->id,
            'photo_id' => $photo->id,
        ]);
        $this->assertDatabaseHas('contact_photo', [
            'contact_id' => $contact2->id,
            'photo_id' => $photo->id,
        ]);
    }

    public function test_edit_screen_passes_storage_limit_false_when_under_quota()
    {
        [$user, $contact] = $this->fetchUser();
        config(['monica.requires_subscription' => true]);
        config(['monica.max_storage_size' => 100]);

        $response = $this->get('/people/'.$contact->hashID().'/avatar');

        $response->assertStatus(200);
        $response->assertSee(':has-reached-account-storage-limit="false"', false);
    }

    public function test_edit_screen_passes_storage_limit_true_when_over_quota()
    {
        [$user, $contact] = $this->fetchUser();
        config(['monica.requires_subscription' => true]);
        config(['monica.max_storage_size' => 0.1]);

        factory(Document::class)->create([
            'filesize' => 1000000,
            'account_id' => $user->account_id,
        ]);

        $response = $this->get('/people/'.$contact->hashID().'/avatar');

        $response->assertStatus(200);
        $response->assertSee(':has-reached-account-storage-limit="true"', false);
    }
}
