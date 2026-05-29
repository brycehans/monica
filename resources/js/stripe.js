
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
import StripeSubscription from './components/settings/Subscription.vue';
import FormInput from './components/partials/form/Input.vue';
import ContactSearch from './components/people/ContactSearch.vue';
import common from './common';

common.loadLanguage(window.Laravel.locale, true).then((i18n) => {
  const app = createApp({
    data() {
      return {
        htmldir: window.Laravel.htmldir,
        locale: i18n.global.locale,
      };
    },
  });

  app.use(i18n);

  // Custom components
  app.component('StripeSubscription', StripeSubscription);

  // Form elements
  app.component('FormInput', FormInput);

  app.component('ContactSearch', ContactSearch);

  app.mount('#app');

  return app;
});
