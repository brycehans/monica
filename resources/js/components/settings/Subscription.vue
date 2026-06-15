<template>
  <form ref="form" class="mb4" :action="callback" method="post" @submit.prevent="subscribe()">
    <notifications group="subscription" position="top middle" :duration="5000" width="400" />

    <div class="form-group">
      <div v-if="errors" role="alert" class="alert alert-danger w-100">
        {{ errors }}
      </div>

      <div v-if="paymentSucceeded">
        <h1 class="text-xl mt-2 mb-4 text-gray-700">
          {{ t('settings.subscriptions_payment_succeeded_title') }}
        </h1>
        <p v-if="successMessage" class="mb-6">
          {{ successMessage }}
        </p>
        <p v-else class="mb-6">
          {{ t('settings.subscriptions_payment_succeeded') }}
        </p>
      </div>

      <div v-else-if="paymentCancelled">
        <h1 class="text-xl mt-2 mb-4 text-gray-700">
          {{ t('settings.subscriptions_payment_cancelled_title') }}
        </h1>

        <p class="mb-6">
          {{ t('settings.subscriptions_payment_cancelled') }}
        </p>
      </div>

      <div v-else-if="! paymentProcessed" id="payment-elements" class="b--gray-monica ba pa4 br2 mb3 bg-black-05">
        <div class="form-row">
          <div class="mb3">
            <form-input
              :id="'cardholder-name'"
              v-model="selectedName"
              :input-type="'text'"
              :iclass="'br3 b--black-30 ba pa3 w-100 f4'"
              :required="true"
              :title="t('settings.subscriptions_upgrade_name')"
            />
          </div>

          <div class="mb3">
            <form-input
              :id="'address-zip'"
              v-model="zip"
              :input-type="'text'"
              :iclass="'br3 b--black-30 ba pa3 w-100 f4'"
              :title="t('settings.subscriptions_upgrade_zip')"
            />
          </div>

          <label for="card-element">
            {{ t('settings.subscriptions_upgrade_credit') }}
          </label>
          <div id="card-element">
            <!-- a Stripe Element will be inserted here. -->
          </div>
        </div>

        <button
          id="card-button"
          class="btn btn-primary w-100 mt3"
          :disabled="paymentProcessing"
          @click.prevent="confirm ? confirmPayment() : subscribe()"
          v-html="t('settings.subscriptions_upgrade_submit', { amount: amount })"
        >
        </button>
      </div>
      <a v-if="paymentProcessed" :href="callback"
         class="btn btn-secondary w-100 tc"
      >
        {{ t('app.go_back') }}
      </a>
    </div>
    <input type="hidden" name="_token" :value="token" />
    <input type="hidden" name="plan" :value="plan" />
    <input type="hidden" name="payment_method" :value="paymentMethod" />
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotify } from '../../composables/useNotify';

interface StripeError {
  code?: string;
  param?: string;
  message?: string;
}

interface StripeCardElement {
  mount: (selector: string) => void;
  addEventListener: (event: string, cb: (event: { error?: StripeError }) => void) => void;
}

interface StripeSetupIntent {
  payment_method: string;
}

interface StripeInstance {
  elements: () => {
    create: (type: string, options: unknown) => StripeCardElement;
  };
  handleCardSetup: (
    clientSecret: string,
    element: StripeCardElement,
    data: unknown,
  ) => Promise<{ error?: StripeError; setupIntent?: StripeSetupIntent }>;
  handleCardPayment: (
    clientSecret: string,
    element: StripeCardElement,
    data: unknown,
  ) => Promise<{ error?: StripeError }>;
}

declare const Stripe: (key: string) => StripeInstance;

const props = withDefaults(
  defineProps<{
    name?: string;
    stripeKey?: string;
    clientSecret?: string;
    plan?: string;
    amount?: string;
    callback?: string;
    token?: string;
    confirm?: boolean;
    paymentSucceeded?: boolean;
    paymentCancelled?: boolean;
  }>(),
  {
    name: '',
    stripeKey: '',
    clientSecret: '',
    plan: '',
    amount: '',
    callback: '',
    token: '',
    confirm: false,
    paymentSucceeded: false,
    paymentCancelled: false,
  },
);

const { t } = useI18n();
const { notify } = useNotify();

const formEl = useTemplateRef<HTMLFormElement>('form');

const selectedName = ref('');
const stripe = ref<StripeInstance | null>(null);
const zip = ref('');
const errors = ref('');
const successMessage = ref('');
const cardElement = ref<StripeCardElement | null>(null);
const paymentMethod = ref('');
const paymentProcessing = ref(false);
const paymentProcessed = ref(false);

watch(() => props.name, () => {
  selectedName.value = props.name;
});

onMounted(() => {
  selectedName.value = props.name;
  if (props.paymentSucceeded || props.paymentCancelled) {
    paymentProcessed.value = true;
  }
  if (!paymentProcessed.value) {
    start();
  }
});

function start() {
  stripe.value = Stripe(props.stripeKey);

  const elements = stripe.value.elements();

  const style = {
    base: {
      color: '#32325d',
      lineHeight: '18px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' },
  };

  cardElement.value = elements.create('card', { hidePostalCode: true, style });
  cardElement.value.mount('#card-element');

  cardElement.value.addEventListener('change', (event) => {
    errors.value = event.error ? event.error.message ?? '' : '';
  });
}

function handleError(error: StripeError) {
  if (
    error.code === 'parameter_invalid_empty' &&
    error.param === 'payment_method_data[billing_details][name]'
  ) {
    errors.value = t('settings.subscriptions_payment_error_name');
  } else {
    errors.value = error.message ?? '';
  }
}

function notifyMessage(text: string, success: boolean) {
  notify({
    group: 'subscription',
    title: text,
    text: '',
    type: success ? 'success' : 'error',
  });
}

async function subscribe() {
  errors.value = '';
  paymentProcessing.value = true;
  paymentProcessed.value = false;

  if (!stripe.value || !cardElement.value) return;

  const result = await stripe.value.handleCardSetup(props.clientSecret, cardElement.value, {
    payment_method_data: {
      billing_details: {
        name: selectedName.value,
        address: { postal_code: zip.value },
      },
    },
  });

  paymentProcessing.value = false;
  if (result.error) {
    handleError(result.error);
  } else if (result.setupIntent) {
    paymentProcessed.value = true;
    successMessage.value = t('settings.subscriptions_payment_success');
    notifyMessage(successMessage.value, true);
    processPayment(result.setupIntent);
  }
}

function processPayment(setupIntent: StripeSetupIntent) {
  paymentMethod.value = setupIntent.payment_method;
  setTimeout(() => {
    formEl.value?.submit();
  }, 10);
}

async function confirmPayment() {
  paymentProcessing.value = true;
  paymentProcessed.value = false;
  errors.value = '';

  if (!stripe.value || !cardElement.value) return;

  const result = await stripe.value.handleCardPayment(props.clientSecret, cardElement.value, {
    payment_method_data: {
      billing_details: { name: selectedName.value },
    },
  });

  paymentProcessing.value = false;
  if (result.error) {
    handleError(result.error);
  } else {
    paymentProcessed.value = true;
    successMessage.value = t('settings.subscriptions_payment_success');
    notifyMessage(successMessage.value, true);
    setTimeout(() => {
      window.location.href = props.callback;
    }, 3000);
  }
}
</script>
