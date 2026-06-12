
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import './bootstrap';
import { locale, htmldir } from './boot';

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

import { createApp } from 'vue';
import Notifications from '@kyvg/vue3-notification';
import StripeSubscription from './components/settings/Subscription.vue';
import FormInput from './components/partials/form/Input.vue';
import ContactSearch from './components/people/ContactSearch.vue';
import common from './common';

common.loadLanguage(locale, true).then((i18n) => {
  const app = createApp({
    data() {
      return {
        htmldir: htmldir,
        locale: i18n.global.locale,
      };
    },
  });

  app.use(i18n);
  app.use(Notifications);

  // Custom components
  app.component('StripeSubscription', StripeSubscription);

  // Form elements
  app.component('FormInput', FormInput);

  app.component('ContactSearch', ContactSearch);

  app.mount('#app');

  return app;
});
