<style scoped>
.time {
    color: gray;
}
</style>

<template>
  <div class="form-group">
    <notifications group="webauthn" position="top middle" :duration="5000" width="400" />

    <div v-if="method === 'register-modal'">
      <h3>{{ $t('settings.webauthn_title') }}</h3>

      <div v-if="currentkeys !== null">
        <ul class="table">
          <li v-for="key in currentkeys"
              :key="key.id"
              class="table-row"
          >
            <div class="table-cell w-30">
              <strong>{{ key.name }}</strong>
            </div>
            <div class="table-cell time w-50">
              <template v-if="key.counter > 0">
                {{ $t('settings.webauthn_last_use', {timestamp: formatTime(key.updated_at)}) }}
              </template>
            </div>
            <div class="table-cell actions">
              <a class="pointer" href="" @click.prevent="showDeleteModal(key.id)">
                {{ $t('app.delete') }}
              </a>
            </div>
          </li>
        </ul>
      </div>

      <slot></slot>

      <a v-if="isSupported" class="btn btn-primary" href="" @click.prevent="showRegisterModal">
        {{ $t('settings.webauthn_enable_description') }}
      </a>
      <small v-else>
        {{ notSupportedMessage() }}
      </small>


      <sweet-modal
        id="registerModal"
        ref="registerModal"
        overlay-theme="dark"
        :title="$t('settings.webauthn_title')"
      >
        <div v-if="registerTab === '1'">
          <p>
            {{ $t('settings.webauthn_key_name_help') }}
          </p>
          <form-input
            :id="'keyName'"
            v-model="keyName"
            :title="$t('settings.webauthn_key_name')"
            :value="keyName"
            :input-type="'text'"
            :width="150"
            :required="true"
            @keyup.enter="showRegisterModalTab('2');startRegister();"
          />
        </div>
        <div v-if="registerTab === '2'">
          <div v-if="errorMessage !== ''" class="form-error-message mb3">
            <div class="pa2">
              <p class="mb0">
                {{ errorMessage }}
              </p>
              <p>
                <a href="" @click.prevent="startRegister()">
                  {{ $t('app.retry') }}
                </a>
              </p>
            </div>
          </div>
          <div v-if="infoMessage !== ''" class="form-information-message mb3">
            <div class="pa2">
              <p class="mb0">
                {{ infoMessage }}
              </p>
            </div>
          </div>

          <div v-if="errorMessage === ''" class="tc">
            <img src="https://ssl.gstatic.com/accounts/strongauth/Challenge_2SV-Gnubby_graphic.png"
                 :alt="$t('settings.webauthn_insertKey')"
            />
          </div>

          <div v-if="errorMessage === ''" class="pa2">
            <p>
              {{ $t('settings.webauthn_insertKey') }}
            </p>
            <p>
              {{ $t('settings.webauthn_buttonAdvise') }}
              <br />
              {{ $t('settings.webauthn_noButtonAdvise') }}
            </p>
          </div>
        </div>
        <div slot="button">
          <a v-if="registerTab === '1'" class="btn" href="" @click.prevent="showRegisterModalTab('2');startRegister();">
            {{ $t('pagination.next') }}
          </a>
          <a v-else class="btn" href="" @click.prevent="showRegisterModalTab('1')">
            {{ $t('pagination.previous') }}
          </a>
          <a class="btn" href="" @click.prevent="closeRegisterModal()">
            {{ $t('app.cancel') }}
          </a>
        </div>
      </sweet-modal>
    </div>
    <div v-else>
      <div v-if="errorMessage !== ''" class="form-error-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ errorMessage }}
          </p>
          <p>
            <a href="" @click.prevent="start()">
              {{ $t('app.retry') }}
            </a>
          </p>
        </div>
      </div>
      <div v-if="infoMessage !== ''" class="form-information-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ infoMessage }}
          </p>
        </div>
      </div>

      <div class="tc">
        <img src="https://ssl.gstatic.com/accounts/strongauth/Challenge_2SV-Gnubby_graphic.png"
             :alt="$t('settings.webauthn_insertKey')"
        />
      </div>

      <div class="pa2">
        <p>
          {{ $t('settings.webauthn_insertKey') }}
        </p>
        <p>
          {{ $t('settings.webauthn_buttonAdvise') }}
          <br />
          {{ $t('settings.webauthn_noButtonAdvise') }}
        </p>
      </div>
    </div>

    <sweet-modal ref="delete" overlay-theme="dark" title="Remove a key">
      <form>
        <div class="mb4">
          {{ $t('settings.webauthn_delete_confirmation') }}
        </div>
      </form>
      <div slot="button">
        <a class="btn" href="" @click.prevent="closeDeleteModal()">
          {{ $t('app.cancel') }}
        </a>
        <a class="btn" href="" @click.prevent="webauthnRemove(keyToTrash)">
          {{ $t('app.delete') }}
        </a>
      </div>
    </sweet-modal>
  </div>
</template>

<script>
import { SweetModal } from 'sweet-modal-vue';
import moment from 'moment-timezone';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';

export default {

  components: {
    SweetModal
  },

  props: {
    keys: {
      type: Array,
      default: function () {
        return [];
      }
    },
    publicKey: {
      type: Object,
      default: null,
    },
    method: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: '',
    },
    script: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      isSupported: true,
      errorMessage: '',
      infoMessage: '',
      success: false,
      currentkeys: [],
      keyToTrash: '',
      keyName: '',
      registerTab: '',
    };
  },

  mounted() {
    this.prepareComponent();
    this.start();
  },

  methods: {
    prepareComponent() {
      this.currentkeys = this.keys;
      this.isSupported = browserSupportsWebAuthn();
    },

    _errorMessage(name, message) {
      switch (name) {
      case 'InvalidStateError':
        return this.$t('settings.webauthn_error_already_used');
      case 'NotAllowedError':
        return this.$t('settings.webauthn_error_not_allowed');
      default:
        return message;
      }
    },

    notSupportedMessage() {
      if (! window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return this.$t('settings.webauthn_not_secured');
      }
      return this.$t('settings.webauthn_not_supported');
    },

    start() {
      this.errorMessage = '';

      if (! browserSupportsWebAuthn()) {
        this.isSupported = false;
        this.errorMessage = this.notSupportedMessage();
        return;
      }

      switch(this.method) {
      case 'register':
        setTimeout(() => this.doRegister(this.publicKey, true), 10);
        break;
      case 'login':
        this.doLogin(this.publicKey);
        break;
      }
    },

    showRegisterModal() {
      this.errorMessage = '';
      this.infoMessage = '';
      this.keyName = '';
      this.success = false;
      this.showRegisterModalTab('1');
      this.$refs.registerModal.open();
    },

    showRegisterModalTab(tab) {
      this.registerTab = tab;
    },

    startRegister() {
      this.errorMessage = '';
      axios.post('webauthn/keys/options')
        .then(response => {
          if (this.registerTab === '2') {
            setTimeout(() => this.doRegister(response.data.publicKey, false), 10);
          }
        }).catch(error => {
          this.notify(error.response?.data?.message ?? error.message, false);
        });
    },

    closeRegisterModal() {
      this.$refs.registerModal.close();
      this.showRegisterModalTab('');
    },

    async doRegister(publicKey, redirect) {
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: publicKey });
      } catch (error) {
        this.errorMessage = this._errorMessage(error.name, error.message);
        return;
      }
      try {
        const response = await axios.post('webauthn/keys', {
          ...attResp,
          name: this.keyName,
        });
        this.success = true;
        this.notify(this.$t('settings.webauthn_success'), true);
        this.currentkeys.push({
          id: response.data.result.id,
          name: response.data.result.name,
        });
        if (redirect) {
          setTimeout(() => { window.location = response.data.callback; }, 100);
        } else {
          this.closeRegisterModal();
        }
      } catch (error) {
        this.errorMessage = error.message ? error.message : error.response.data.message;
      }
    },

    async doLogin(publicKey) {
      let assertionResp;
      try {
        assertionResp = await startAuthentication({ optionsJSON: publicKey });
      } catch (error) {
        this.errorMessage = this._errorMessage(error.name, error.message);
        return;
      }
      try {
        const response = await axios.post('webauthn/auth', { ...assertionResp });
        this.success = true;
        this.notify(this.$t('settings.webauthn_success'), true);
        window.location = response.data.callback;
      } catch (error) {
        this.errorMessage = error.message ? error.message : error.response.data.message;
      }
    },

    webauthnRemove(id) {
      var self = this;
      axios.delete('webauthn/keys/'+id)
        .then(response => {
          self.currentkeys.splice(self.currentkeys.indexOf(self.currentkeys.find(item => item.id === response.data.id)), 1);
          self.success = true;
          self.notify(self.$t('settings.webauthn_delete_success'), true);
          self.closeDeleteModal();
        }).catch(error => {
          self.errorMessage = error.response.data.message;
        });
    },

    showDeleteModal(id) {
      this.keyToTrash = id;
      this.$refs.delete.open();
    },

    closeDeleteModal() {
      this.$refs.delete.close();
    },

    formatTime(value) {
      moment.locale(this._i18n.locale);
      moment.tz.setDefault('UTC');

      var t = moment(value);
      var date = moment.tz(t, this.timezone);

      return date.format('LLLL');
    },

    notify(text, success) {
      this.$notify({
        group: 'webauthn',
        title: text,
        text: '',
        type: success ? 'success' : 'error'
      });
    }
  }
};
</script>
