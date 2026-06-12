import _ from 'lodash';
import Popper from 'popper.js';
import jQuery from 'jquery';
import axios from 'axios';

// Bootstrap 4 jQuery plugins — side-effect imports that attach methods to
// jQuery.fn. The plugins import jquery as an ESM dep themselves, so the
// bundler hands them the same singleton we use here.
import 'bootstrap/js/dist/util';
import 'bootstrap/js/dist/button';
import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/tab';

window._ = _;
window.Popper = Popper;
window.$ = window.jQuery = jQuery;
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
