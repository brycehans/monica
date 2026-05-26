
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

import Vue from 'vue';
import Notifications from 'vue-notification';
import Tooltip from 'vue-directive-tooltip';
import VueClipboard from 'vue-clipboard2';

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

import './testing';
import common from './common';
import methods from './methods';

window.Vue = Vue;

// Notifications
Vue.use(Notifications);

// Tooltip
Vue.use(Tooltip, { delay: 0 });

// Copy text from clipboard
VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

// Custom components
Vue.component('PassportClients', PassportClients);
Vue.component('PassportAuthorizedClients', PassportAuthorizedClients);
Vue.component('PassportPersonalAccessTokens', PassportPersonalAccessTokens);

// Vue select
Vue.component('ContactSelect', ContactSelect);
Vue.component('ContactSearch', ContactSearch);
Vue.component('ContactMultiSearch', ContactMultiSearch);

// Partials
Vue.component('Avatar', Avatar);
Vue.component('Confirm', Confirm);

// Form elements
Vue.component('FormInput', FormInput);
Vue.component('FormSelect', FormSelect);
Vue.component('FormDate', FormDate);
Vue.component('FormCheckbox', FormCheckbox);
Vue.component('FormRadio', FormRadio);
Vue.component('FormTextarea', FormTextarea);
Vue.component('FormToggle', FormToggle);
Vue.component('FormSpecialdate', FormSpecialdate);
Vue.component('FormSpecialdeceased', FormSpecialdeceased);

// Dashboard
Vue.component('DashboardLog', DashboardLog);

// Contacts
Vue.component('Tags', Tags);
Vue.component('ContactAvatar', ContactAvatar);
Vue.component('ContactFavorite', ContactFavorite);
Vue.component('ContactArchive', ContactArchive);
Vue.component('ContactAddress', ContactAddress);
Vue.component('ContactInformation', ContactInformation);
Vue.component('ContactList', ContactList);
Vue.component('ContactTask', ContactTask);
Vue.component('ContactNote', ContactNote);
Vue.component('ContactGift', ContactGift);
Vue.component('Pet', Pet);
Vue.component('MeContact', MeContact);
Vue.component('StayInTouch', StayInTouch);
Vue.component('LastCalled', LastCalled);
Vue.component('PhoneCallList', PhoneCallList);
Vue.component('ConversationList', ConversationList);
Vue.component('Conversation', Conversation);
Vue.component('Message', Message);
Vue.component('ActivityList', ActivityList);
Vue.component('DocumentList', DocumentList);
Vue.component('CreateLifeEvent', CreateLifeEvent);
Vue.component('CreateDefaultLifeEvent', CreateDefaultLifeEvent);
Vue.component('LifeEventList', LifeEventList);
Vue.component('PhotoList', PhotoList);

// Journal
Vue.component('JournalList', JournalList);
Vue.component('JournalRateDay', JournalRateDay);
Vue.component('JournalCalendar', JournalCalendar);
Vue.component('JournalContentRate', JournalContentRate);
Vue.component('JournalContentActivity', JournalContentActivity);
Vue.component('JournalContentEntry', JournalContentEntry);

// Settings
Vue.component('ContactFieldTypes', ContactFieldTypes);
Vue.component('Genders', Genders);
Vue.component('ReminderRules', ReminderRules);
Vue.component('ReminderTime', ReminderTime);
Vue.component('MfaActivate', MfaActivate);
Vue.component('WebauthnConnector', WebauthnConnector);
Vue.component('RecoveryCodes', RecoveryCodes);
Vue.component('Modules', Modules);
Vue.component('ActivityTypes', ActivityTypes);
Vue.component('LifeEventTypes', LifeEventTypes);
Vue.component('DavResources', DavResources);

common.loadLanguage(window.Laravel.locale, true).then((i18n) => {
  // the Vue appplication
  const app = new Vue({
    i18n,
    data: {
      htmldir: window.Laravel.htmldir,
      timezone: window.Laravel.timezone,
      locale: i18n.locale,
      reminders_frequency: 'once',
      accept_invite_user: false,
      date_met_the_contact: 'known',
      global_relationship_form_new_contact: true,
      global_profile_default_view: window.Laravel.profileDefaultView,
    },

    // global methods
    methods,
  }).$mount('#app');

  return app;
});

$(document).ready(function() {
});
