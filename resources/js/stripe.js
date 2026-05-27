
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
import StripeSubscription from './components/settings/Subscription.vue';
import FormInput from './components/partials/form/Input.vue';
import ContactSearch from './components/people/ContactSearch.vue';
import common from './common';

window.Vue = Vue;

// Notifications
Vue.use(Notifications);

// Custom components
Vue.component('StripeSubscription', StripeSubscription);

// Form elements
Vue.component('FormInput', FormInput);

Vue.component('ContactSearch', ContactSearch);

common.loadLanguage(window.Laravel.locale, true).then((i18n) => {
  // the Vue appplication
  const app = new Vue({
    i18n,
    data: {
      htmldir: window.Laravel.htmldir,
      locale: i18n.locale,
    },
  }).$mount('#app');

  return app;
});
