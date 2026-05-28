'use strict';

// axios
import axios from 'axios';

// Vue (imported explicitly rather than relying on window.Vue — modules are
// singletons, so this is the same instance app.js/stripe.js use.)
import Vue from 'vue';

// i18n
import VueI18n from 'vue-i18n';
Vue.use(VueI18n);

// Moments
import moment from 'moment';
// Register moment locale data for the 17 languages we ship (keep in sync with
// `config/lang.php` / Crowdin). Imports go through `moment/dist/locale/*`,
// not `moment/locale/*` — the dist/ files are ESM modules whose top-level
// `moment.defineLocale(...)` call registers against the moment instance from
// `moment/dist/moment.js`. The vite.config.js alias forces `import moment from
// 'moment'` to that same ESM build, so the registrations reach the consumer-
// facing moment. The UMD-wrapped `moment/locale/*.js` files leave Rollup in
// `factory(global.moment)` fallback mode — the calls execute but land on an
// orphan moment, which is why #718 happened.
import 'moment/dist/locale/ar';
import 'moment/dist/locale/de';
import 'moment/dist/locale/el';
import 'moment/dist/locale/en-gb';
import 'moment/dist/locale/es';
import 'moment/dist/locale/fr';
import 'moment/dist/locale/he';
import 'moment/dist/locale/id';
import 'moment/dist/locale/it';
import 'moment/dist/locale/nl';
import 'moment/dist/locale/pt-br';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/sv';
import 'moment/dist/locale/tr';
import 'moment/dist/locale/vi';
import 'moment/dist/locale/zh-cn';
import 'moment/dist/locale/zh-tw';

// Markdown
import { marked } from 'marked';
import DOMPurify from 'dompurify';
window.marked = marked;
window.DOMPurify = DOMPurify;

// i18n
import messages from '../../public/js/langs/en.json';
import pluralization from './pluralization.js';

export default {
  i18n: new VueI18n({
    locale: 'en', // set locale
    fallbackLocale: 'en',
    messages: {'en': messages},
    pluralizationRules: pluralization,
  }),
  
  loadedLanguages : ['en'], // our default language that is preloaded
  
  _setI18nLanguage (lang) {
    this.i18n.locale = lang;
    axios.defaults.headers.common['Accept-Language'] = lang;
    document.querySelector('html').setAttribute('lang', lang);
  },
  
  _loadLanguageAsync (lang) {
    if (this.i18n.locale !== lang) {
      if (!this.loadedLanguages.includes(lang)) {
        return axios.get(`js/langs/${lang}.json`).then(msgs => {
          this.i18n.setLocaleMessage(lang, msgs.data);
          this.loadedLanguages.push(lang);
          return this.i18n;
        });
      }
    }
    return Promise.resolve(this.i18n);
  },

  loadLanguage: function(lang, set) {
    return this._loadLanguageAsync(lang).then(i18n => {
      if (set) {
        this._setI18nLanguage(lang);
      }
      moment.locale(lang === 'zh' ? 'zh-cn' : lang);
      return i18n;
    });
  }
};