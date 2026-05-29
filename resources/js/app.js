
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import './bootstrap';

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

import { createApp } from 'vue';

// Custom components — Passport
import PassportClients from './components/passport/Clients.vue';
import PassportAuthorizedClients from './components/passport/AuthorizedClients.vue';
import PassportPersonalAccessTokens from './components/passport/PersonalAccessTokens.vue';

// Vue select
import ContactSelect from './components/people/ContactSelect.vue';
import ContactSearch from './components/people/ContactSearch.vue';
import ContactMultiSearch from './components/people/ContactMultiSearch.vue';

// Partials
import Avatar from './components/partials/Avatar.vue';
import Confirm from './components/partials/Confirm.vue';

// Form elements
import FormInput from './components/partials/form/Input.vue';
import FormSelect from './components/partials/form/Select.vue';
import FormDate from './components/partials/form/Date.vue';
import FormCheckbox from './components/partials/form/Checkbox.vue';
import FormRadio from './components/partials/form/Radio.vue';
import FormTextarea from './components/partials/form/Textarea.vue';
import FormToggle from './components/partials/form/Toggle.vue';
import FormSpecialdate from './components/partials/SpecialDate.vue';
import FormSpecialdeceased from './components/partials/SpecialDeceased.vue';

// Dashboard
import DashboardLog from './components/dashboard/DashboardLog.vue';

// Contacts
import Tags from './components/people/Tags.vue';
import ContactAvatar from './components/people/SetAvatar.vue';
import ContactFavorite from './components/people/SetFavorite.vue';
import ContactArchive from './components/people/Archive.vue';
import ContactAddress from './components/people/Addresses.vue';
import ContactInformation from './components/people/ContactInformation.vue';
import ContactList from './components/people/ContactList.vue';
import ContactTask from './components/people/Tasks.vue';
import ContactNote from './components/people/Notes.vue';
import ContactGift from './components/people/gifts/Gifts.vue';
import Pet from './components/people/Pets.vue';
import MeContact from './components/people/MeContact.vue';
import StayInTouch from './components/people/StayInTouch.vue';
import LastCalled from './components/people/calls/LastCalled.vue';
import PhoneCallList from './components/people/calls/PhoneCallList.vue';
import ConversationList from './components/people/conversation/ConversationList.vue';
import Conversation from './components/people/conversation/Conversation.vue';
import Message from './components/people/conversation/Message.vue';
import ActivityList from './components/people/activity/ActivityList.vue';
import DocumentList from './components/people/document/DocumentList.vue';
import CreateLifeEvent from './components/people/lifeevent/CreateLifeEvent.vue';
import CreateDefaultLifeEvent from './components/people/lifeevent/content/CreateDefaultLifeEvent.vue';
import LifeEventList from './components/people/lifeevent/LifeEventList.vue';
import PhotoList from './components/people/photo/PhotoList.vue';

// Journal
import JournalList from './components/journal/JournalList.vue';
import JournalRateDay from './components/journal/RateDay.vue';
import JournalCalendar from './components/journal/partials/JournalCalendar.vue';
import JournalContentRate from './components/journal/partials/JournalContentRate.vue';
import JournalContentActivity from './components/journal/partials/JournalContentActivity.vue';
import JournalContentEntry from './components/journal/partials/JournalContentEntry.vue';

// Settings
import ContactFieldTypes from './components/settings/ContactFieldTypes.vue';
import Genders from './components/settings/Genders.vue';
import ReminderRules from './components/settings/ReminderRules.vue';
import ReminderTime from './components/settings/ReminderTime.vue';
import MfaActivate from './components/settings/MfaActivate.vue';
import WebauthnConnector from './components/settings/WebauthnConnector.vue';
import RecoveryCodes from './components/settings/RecoveryCodes.vue';
import Modules from './components/settings/Modules.vue';
import ActivityTypes from './components/settings/ActivityTypes.vue';
import LifeEventTypes from './components/settings/LifeEventTypes.vue';
import DavResources from './components/settings/DAVResources.vue';

import testingDirectives from './testing';
import common from './common';
import methods from './methods';

common.loadLanguage(window.Laravel.locale, true).then((i18n) => {
  const app = createApp({
    data() {
      return {
        htmldir: window.Laravel.htmldir,
        timezone: window.Laravel.timezone,
        locale: i18n.global.locale,
        reminders_frequency: 'once',
        accept_invite_user: false,
        date_met_the_contact: 'known',
        global_relationship_form_new_contact: true,
        global_profile_default_view: window.Laravel.profileDefaultView,
      };
    },
    methods,
  });

  app.use(i18n);
  app.use(testingDirectives);

  // Custom components
  app.component('PassportClients', PassportClients);
  app.component('PassportAuthorizedClients', PassportAuthorizedClients);
  app.component('PassportPersonalAccessTokens', PassportPersonalAccessTokens);

  // Vue select
  app.component('ContactSelect', ContactSelect);
  app.component('ContactSearch', ContactSearch);
  app.component('ContactMultiSearch', ContactMultiSearch);

  // Partials
  app.component('Avatar', Avatar);
  app.component('Confirm', Confirm);

  // Form elements
  app.component('FormInput', FormInput);
  app.component('FormSelect', FormSelect);
  app.component('FormDate', FormDate);
  app.component('FormCheckbox', FormCheckbox);
  app.component('FormRadio', FormRadio);
  app.component('FormTextarea', FormTextarea);
  app.component('FormToggle', FormToggle);
  app.component('FormSpecialdate', FormSpecialdate);
  app.component('FormSpecialdeceased', FormSpecialdeceased);

  // Dashboard
  app.component('DashboardLog', DashboardLog);

  // Contacts
  app.component('Tags', Tags);
  app.component('ContactAvatar', ContactAvatar);
  app.component('ContactFavorite', ContactFavorite);
  app.component('ContactArchive', ContactArchive);
  app.component('ContactAddress', ContactAddress);
  app.component('ContactInformation', ContactInformation);
  app.component('ContactList', ContactList);
  app.component('ContactTask', ContactTask);
  app.component('ContactNote', ContactNote);
  app.component('ContactGift', ContactGift);
  app.component('Pet', Pet);
  app.component('MeContact', MeContact);
  app.component('StayInTouch', StayInTouch);
  app.component('LastCalled', LastCalled);
  app.component('PhoneCallList', PhoneCallList);
  app.component('ConversationList', ConversationList);
  app.component('Conversation', Conversation);
  app.component('Message', Message);
  app.component('ActivityList', ActivityList);
  app.component('DocumentList', DocumentList);
  app.component('CreateLifeEvent', CreateLifeEvent);
  app.component('CreateDefaultLifeEvent', CreateDefaultLifeEvent);
  app.component('LifeEventList', LifeEventList);
  app.component('PhotoList', PhotoList);

  // Journal
  app.component('JournalList', JournalList);
  app.component('JournalRateDay', JournalRateDay);
  app.component('JournalCalendar', JournalCalendar);
  app.component('JournalContentRate', JournalContentRate);
  app.component('JournalContentActivity', JournalContentActivity);
  app.component('JournalContentEntry', JournalContentEntry);

  // Settings
  app.component('ContactFieldTypes', ContactFieldTypes);
  app.component('Genders', Genders);
  app.component('ReminderRules', ReminderRules);
  app.component('ReminderTime', ReminderTime);
  app.component('MfaActivate', MfaActivate);
  app.component('WebauthnConnector', WebauthnConnector);
  app.component('RecoveryCodes', RecoveryCodes);
  app.component('Modules', Modules);
  app.component('ActivityTypes', ActivityTypes);
  app.component('LifeEventTypes', LifeEventTypes);
  app.component('DavResources', DavResources);

  app.mount('#app');

  return app;
});

$(document).ready(function() {
});
