import Vue from 'vue';
import _ from 'lodash';
import Addresses from '../../../resources/js/components/people/Addresses.vue';

const $t = (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key);

function makeAxiosStub() {
  return {
    get: cy.stub().callsFake((url) => {
      if (url.endsWith('/addresses')) return Promise.resolve({ data: [] });
      if (url === 'countries') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
    put: cy.stub().resolves({ data: {} }),
    post: cy.stub().resolves({ data: {} }),
    delete: cy.stub().resolves({ data: {} }),
  };
}

function makeAddress(overrides = {}) {
  return {
    id: 1,
    name: 'Home',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    country: '',
    latitude: 0,
    longitude: 0,
    edit: false,
    ...overrides,
  };
}

function mountAddresses() {
  const SweetModalStub = { template: '<div><slot></slot></div>' };
  const PassthroughInput = { template: '<input />' };
  const PassthroughSelect = { template: '<select></select>' };
  const ConfirmStub = { template: '<div></div>' };

  return cy.mount(
    {
      name: 'AddressesHost',
      template: `<Addresses ref="addresses" :hash="'abc'" />`,
      components: { Addresses },
      data() {
        return { htmldir: 'ltr' };
      },
    },
    {
      stubs: {
        SweetModal: SweetModalStub,
        'sweet-modal': SweetModalStub,
        FormInput: PassthroughInput,
        'form-input': PassthroughInput,
        FormSelect: PassthroughSelect,
        'form-select': PassthroughSelect,
        Confirm: ConfirmStub,
        confirm: ConfirmStub,
      },
      mocks: { $t, $tc: $t },
    },
  ).as('mounted');
}

function withAddresses(callback) {
  return cy.get('@mounted').then(({ wrapper }) =>
    callback(wrapper.vm.$refs.addresses, wrapper)
  );
}

describe('Addresses.vue regression coverage', () => {
  beforeEach(() => {
    // Production wires lodash + axios onto window from resources/js/bootstrap.js.
    // Component tests don't load bootstrap.js, so set them up here — the SUT
    // calls bare `_.forEach(...)` and `axios.get(...)` expecting the globals.
    cy.window().then((win) => {
      win._ = _;
      win.axios = makeAxiosStub();
    });
  });

  it('toggleEditExcept clears `edit` on all other addresses without throwing', () => {
    // Regression coverage for PR #684 (require→import sweep). The PR rewrote
    // `Vue.set(a, 'edit', false)` inside a non-arrow `_.forEach` callback to
    // `this.$set(a, 'edit', false)`. The callback is a `function(a) { ... }`
    // and lodash 4 does not pass a thisArg, so under strict mode (which all
    // ESM-compiled SFC <script> blocks run in) `this` is `undefined` and the
    // call throws TypeError.
    //
    // Reachable path: contact with ≥2 addresses → user clicks edit on one →
    // `toggleEdit` → `toggleEditExcept` → throw.
    mountAddresses();

    const a1 = makeAddress({ id: 1, name: 'Home', edit: true });
    const a2 = makeAddress({ id: 2, name: 'Work', edit: true });

    withAddresses((addresses) => {
      addresses.contactAddresses = [a1, a2];
    });

    withAddresses((addresses) => {
      expect(() => addresses.toggleEditExcept(1)).to.not.throw();
      expect(addresses.contactAddresses[1].edit).to.equal(false);
      // The targeted address (id=1) is intentionally left untouched —
      // toggleEditExcept only clears the OTHERS. toggleEdit() handles
      // toggling the targeted one.
      expect(addresses.contactAddresses[0].edit).to.equal(true);
    });
  });

  it('toggleEdit on one of multiple addresses keeps siblings collapsed', () => {
    // End-to-end of the same bug at the public API level: toggleEdit is what
    // the v-on:click binding in the template actually calls.
    mountAddresses();

    const a1 = makeAddress({ id: 1, name: 'Home', edit: false });
    const a2 = makeAddress({ id: 2, name: 'Work', edit: true });

    withAddresses((addresses) => {
      addresses.contactAddresses = [a1, a2];
    });

    withAddresses((addresses) => {
      expect(() => addresses.toggleEdit(addresses.contactAddresses[0])).to.not.throw();
      expect(addresses.contactAddresses[0].edit).to.equal(true);
      expect(addresses.contactAddresses[1].edit).to.equal(false);
    });
  });
});
