<?php

namespace App\Models\Instance;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $number_of_users
 * @property int $number_of_contacts
 * @property int $number_of_notes
 * @property int $number_of_oauth_access_tokens
 * @property int $number_of_oauth_clients
 * @property int $number_of_offsprings
 * @property int $number_of_progenitors
 * @property int $number_of_relationships
 * @property int $number_of_subscriptions
 * @property int $number_of_reminders
 * @property int $number_of_tasks
 * @property int $number_of_kids
 * @property int $number_of_activities
 * @property int $number_of_addresses
 * @property int $number_of_api_calls
 * @property int $number_of_calls
 * @property int $number_of_contact_fields
 * @property int $number_of_contact_field_types
 * @property int $number_of_debts
 * @property int $number_of_entries
 * @property int $number_of_gifts
 * @property int|null $number_of_invitations_sent
 * @property int|null $number_of_accounts_with_more_than_one_user
 * @property int|null $number_of_tags
 * @property int|null $number_of_import_jobs
 * @property int|null $number_of_conversations
 * @property int|null $number_of_messages
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfAccountsWithMoreThanOneUser($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfActivities($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfAddresses($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfApiCalls($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfCalls($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfContactFieldTypes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfContactFields($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfContacts($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfConversations($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfDebts($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfEntries($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfGifts($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfImportJobs($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfInvitationsSent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfKids($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfMessages($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfOauthAccessTokens($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfOauthClients($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfOffsprings($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfProgenitors($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfRelationships($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfReminders($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfSubscriptions($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfTags($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfTasks($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereNumberOfUsers($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Statistic whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Statistic extends Model
{
}
