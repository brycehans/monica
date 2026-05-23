import Vue from 'vue';
import SetAvatar from '../../../resources/js/components/people/SetAvatar.vue';

const $t = (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key);

const FormRadioStub = {
  name: 'form-radio',
  model: { prop: 'modelValue', event: 'change' },
  props: ['value', 'modelValue', 'name', 'dclass', 'iclass', 'disabled'],
  template: `
    <label :data-value="value" :data-disabled="disabled">
      <slot name="label"></slot>
      <slot name="extra"></slot>
    </label>
  `,
};

const SweetModalStub = {
  name: 'sweet-modal',
  props: ['title', 'blocking', 'hideCloseButton'],
  data() {
    return { isOpen: false };
  },
  methods: {
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
  },
  template: `
    <div v-if="isOpen" data-cy="crop-modal">
      <slot></slot>
      <slot name="button"></slot>
    </div>
  `,
};

function makeClipperStub() {
  return {
    name: 'clipper-basic',
    props: ['src', 'ratio', 'initWidth', 'initHeight'],
    template: '<div data-cy="cropper-stub" :data-src="src"></div>',
    methods: {
      clip() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
      },
    },
  };
}

beforeEach(() => {
  Vue.component('FormRadio', FormRadioStub);
});

function mountSetAvatar(propsData = {}) {
  const baseProps = {
    avatar: '',
    defaultUrl: '/default.png',
    adorableUrl: '/adorable.png',
    gravatarUrl: '',
    photoUrl: '',
    hasReachedAccountStorageLimit: false,
    maxUploadSize: 10000,
    ...propsData,
  };

  return cy.mount(
    {
      name: 'SetAvatarHost',
      template: `
        <SetAvatar ref="setAvatar"
          :avatar="hostProps.avatar"
          :default-url="hostProps.defaultUrl"
          :adorable-url="hostProps.adorableUrl"
          :gravatar-url="hostProps.gravatarUrl"
          :photo-url="hostProps.photoUrl"
          :has-reached-account-storage-limit="hostProps.hasReachedAccountStorageLimit"
          :max-upload-size="hostProps.maxUploadSize"
        />
      `,
      components: { SetAvatar },
      data() {
        return { hostProps: baseProps, htmldir: 'ltr' };
      },
    },
    {
      stubs: {
        'form-radio': FormRadioStub,
        SweetModal: SweetModalStub,
        'sweet-modal': SweetModalStub,
        clipperBasic: makeClipperStub(),
        'clipper-basic': makeClipperStub(),
      },
      mocks: { $t, $tc: $t },
    },
  ).as('mounted');
}

function withSetAvatar(callback) {
  return cy.get('@mounted').then(({ wrapper }) => callback(wrapper.vm.$refs.setAvatar, wrapper));
}

function selectFixture(selector = 'input[type=file]') {
  return cy.get(selector).selectFile('tests/cypress/fixtures/avatar-test.jpg', { force: true });
}

describe('SetAvatar.vue regression coverage', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => `blob:stub-${Math.random()}`).as('createObjectURL');
      cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
    });
  });

  it('mirrors the avatar prop into selectedAvatar on mount', () => {
    mountSetAvatar({ avatar: 'gravatar', gravatarUrl: '/g.png' });
    withSetAvatar((setAvatar) => {
      expect(setAvatar.selectedAvatar).to.equal('gravatar');
      expect(setAvatar.initialAvatar).to.equal('gravatar');
    });
  });

  it('updates selectedAvatar when the avatar prop changes', () => {
    mountSetAvatar({ avatar: 'default' });
    cy.get('@mounted').then(async ({ wrapper }) => {
      await wrapper.setData({ hostProps: { ...wrapper.vm.hostProps, avatar: 'adorable' } });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$refs.setAvatar.selectedAvatar).to.equal('adorable');
    });
  });

  it('opens the crop modal when a file is chosen', () => {
    mountSetAvatar();
    cy.get('[data-cy=crop-modal]').should('not.exist');
    selectFixture();
    cy.get('[data-cy=crop-modal]').should('exist');
    withSetAvatar((setAvatar) => {
      expect(setAvatar.uploadedImgUrl).to.match(/^blob:stub-/);
    });
  });

  it('revokes the prior object URL when a second file is chosen', () => {
    mountSetAvatar();
    selectFixture();
    cy.get('[data-cy=crop-modal]').should('exist');
    withSetAvatar((setAvatar) => {
      setAvatar.$refs.cropModal.close();
    });
    selectFixture();
    cy.get('@revokeObjectURL').should('have.been.calledWith', Cypress.sinon.match(/^blob:stub-/));
  });

  it('round-trips the cropper canvas into input.files via DataTransfer', () => {
    mountSetAvatar();
    selectFixture();
    withSetAvatar((setAvatar) => {
      setAvatar.setCroppedImg();
    });
    cy.wait(50);
    withSetAvatar((setAvatar) => {
      const input = setAvatar.$refs.uploadedImg;
      expect(input.files.length).to.equal(1);
      expect(input.files[0]).to.be.instanceOf(File);
      expect(input.files[0].type).to.equal('image/jpeg');
      expect(input.files[0].name).to.equal('avatar-test.jpg');
    });
  });

  it('updates croppedImgUrl after setCroppedImg completes', () => {
    mountSetAvatar();
    selectFixture();
    withSetAvatar((setAvatar) => {
      setAvatar.setCroppedImg();
    });
    cy.wait(50);
    withSetAvatar((setAvatar) => {
      expect(setAvatar.croppedImgUrl).to.match(/^blob:stub-/);
    });
  });

  it('cancelCrop clears state and closes the modal', () => {
    mountSetAvatar();
    selectFixture();
    cy.get('[data-cy=crop-modal]').should('exist');
    withSetAvatar((setAvatar) => {
      setAvatar.croppedImgUrl = 'blob:stub-leftover';
      setAvatar.cancelCrop();
      expect(setAvatar.croppedImgUrl).to.equal('');
      expect(setAvatar.$refs.uploadedImg.files.length).to.equal(0);
    });
    cy.get('[data-cy=crop-modal]').should('not.exist');
  });

  it('disables the upload radio when the account storage limit is reached', () => {
    mountSetAvatar({ hasReachedAccountStorageLimit: true });
    cy.get('label[data-value=upload]').should('have.attr', 'data-disabled', 'true');
  });
});
