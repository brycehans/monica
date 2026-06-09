<?php

namespace App\Services\Account\Settings;

use App\Helpers\AccountHelper;
use App\Models\User\User;
use App\Services\BaseService;
use App\Services\User\EmailChange;
use Illuminate\Validation\Rule;

class UpdateUserSettings extends BaseService
{
    /**
     * Get the validation rules that apply to the service.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'account_id' => 'required|integer|exists:accounts,id',
            'user_id' => 'required|integer',
            'first_name' => 'required|max:255',
            'last_name' => 'required|max:255',
            'email' => 'required|email|max:255',
            'timezone' => 'required|string',
            'locale' => 'required|string',
            'currency_id' => 'required|int|exists:currencies,id',
            'name_order' => 'required|string',
            'fluid_container' => 'required|bool',
            'temperature_scale' => [
                'required',
                'string',
                Rule::in(['fahrenheit', 'celsius']),
            ],
            'reminder_time' => 'required|integer|min:0|max:23',
            'me_contact_id' => 'nullable|integer',
        ];
    }

    /**
     * Update user-level settings (profile, locale, currency, reminders) and
     * the account's default reminder time. Delegates email changes to
     * EmailChange so the double-opt-in flow stays in one place.
     *
     * @param  array  $data
     * @return User
     */
    public function execute(array $data): User
    {
        $this->validate($data);

        /** @var User */
        $user = User::where('account_id', $data['account_id'])
            ->findOrFail($data['user_id']);

        $user->update([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'timezone' => $data['timezone'],
            'locale' => $data['locale'],
            'currency_id' => $data['currency_id'],
            'name_order' => $data['name_order'],
            'fluid_container' => $data['fluid_container'],
            'temperature_scale' => $data['temperature_scale'],
        ]);

        if ($user->email !== $data['email']) {
            app(EmailChange::class)->execute([
                'account_id' => $user->account_id,
                'email' => $data['email'],
                'user_id' => $user->id,
            ]);
        }

        if (! AccountHelper::hasLimitations($user->account) && ! empty($data['me_contact_id'])) {
            $user->me_contact_id = $data['me_contact_id'];
            $user->save();
        }

        $user->account->default_time_reminder_is_sent = $data['reminder_time'];
        $user->account->save();

        return $user;
    }
}
