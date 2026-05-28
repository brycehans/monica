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
// Register moment locale data. Mix's webpack handled this automatically because
// it follows moment's dynamic require(), and `moment-locales-webpack-plugin`
// (now removed) filtered the 138 bundled locales down to the 17 we ship below.
// Rollup/Vite doesn't follow that dynamic require, so without these explicit
// side-effect imports the bundle would ship moment + English-only and every
// `moment.locale(this._i18n.locale)` call would silently no-op. Keep this list
// in sync with `config/lang.php` / Crowdin and the old Mix allowlist.
import 'moment/locale/ar';
import 'moment/locale/de';
import 'moment/locale/el';
import 'moment/locale/en-gb';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/he';
import 'moment/locale/id';
import 'moment/locale/it';
import 'moment/locale/nl';
import 'moment/locale/pt-br';
import 'moment/locale/ru';
import 'moment/locale/sv';
import 'moment/locale/tr';
import 'moment/locale/vi';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-tw';

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