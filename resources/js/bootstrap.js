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

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo'
//
// window.Pusher = Pusher;
//
// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: import.meta.env.VITE_PUSHER_APP_KEY,
//     cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
//     encrypted: true
// });
