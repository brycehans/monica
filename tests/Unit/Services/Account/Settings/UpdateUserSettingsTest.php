<?php

namespace Tests\Unit\Services\Account\Settings;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use App\Models\User\User;
use App\Models\Account\Account;
use App\Models\Contact\Contact;
use Illuminate\Validation\ValidationException;
use App\Services\Account\Settings\UpdateUserSettings;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class UpdateUserSettingsTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_updates_user_settings()
    {
        NotificationFacade::fake();
        config(['monica.requires_subscription' => false]);

        $user = factory(User::class)->create([
            'first_name' => 'Old',
            'last_name' => 'Name',
            'timezone' => 'UTC',
            'locale' => 'en',
            'name_order' => 'firstname_lastname',
        ]);
        $contact = factory(Contact::class)->create([
            'account_id' => $user->account_id,
        ]);

        $request = $this->validRequest($user, [
            'first_name' => 'New',
            'last_name' => 'Person',
            'timezone' => 'Europe/Berlin',
            'me_contact_id' => $contact->id,
            'reminder_time' => 9,
        ]);

        $result = app(UpdateUserSettings::class)->execute($request);

        $this->assertInstanceOf(User::class, $result);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'New',
            'last_name' => 'Person',
            'timezone' => 'Europe/Berlin',
            'me_contact_id' => $contact->id,
        ]);

        $this->assertDatabaseHas('accounts', [
            'id' => $user->account_id,
            'default_time_reminder_is_sent' => 9,
        ]);
    }

    #[Test]
    public function it_fails_if_wrong_parameters_are_given()
    {
        $this->expectException(ValidationException::class);

        app(UpdateUserSettings::class)->execute([
            'first_name' => 'New',
        ]);
    }

    #[Test]
    public function it_throws_an_exception_if_user_is_not_linked_to_account()
    {
        $account = factory(Account::class)->create();
        $user = factory(User::class)->create();

        $request = $this->validRequest($user, [
            'account_id' => $account->id,
        ]);

        $this->expectException(ModelNotFoundException::class);

        app(UpdateUserSettings::class)->execute($request);
    }

    #[Test]
    public function it_calls_email_change_when_email_differs()
    {
        NotificationFacade::fake();
        config(['monica.signup_double_optin' => false]);

        $user = factory(User::class)->create([
            'email' => 'old@example.com',
        ]);

        $request = $this->validRequest($user, [
            'email' => 'new@example.com',
        ]);

        app(UpdateUserSettings::class)->execute($request);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'new@example.com',
        ]);
    }

    #[Test]
    public function it_does_not_update_me_contact_id_when_account_is_limited()
    {
        NotificationFacade::fake();
        // Force AccountHelper::hasLimitations() to return true: subscription required,
        // account is not subscribed, and not on free-paid-access plan (factory default).
        config(['monica.requires_subscription' => true]);

        $user = factory(User::class)->create([
            'me_contact_id' => null,
        ]);
        $contact = factory(Contact::class)->create([
            'account_id' => $user->account_id,
        ]);

        $request = $this->validRequest($user, [
            'me_contact_id' => $contact->id,
        ]);

        app(UpdateUserSettings::class)->execute($request);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'me_contact_id' => null,
        ]);
    }

    /**
     * Build a fully-populated request payload, overridable per-test.
     */
    private function validRequest(User $user, array $overrides = []): array
    {
        return array_merge([
            'account_id' => $user->account_id,
            'user_id' => $user->id,
            'first_name' => $user->first_name ?? 'First',
            'last_name' => $user->last_name ?? 'Last',
            'email' => $user->email,
            'timezone' => $user->timezone ?? 'UTC',
            'locale' => $user->locale ?? 'en',
            'currency_id' => $user->currency_id,
            'name_order' => $user->name_order ?? 'firstname_lastname',
            'fluid_container' => true,
            'temperature_scale' => 'celsius',
            'reminder_time' => 8,
            'me_contact_id' => null,
        ], $overrides);
    }
}
