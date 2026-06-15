<template>
  <div v-if="apierror || errors.length > 0" class="alert alert-danger">
    <p>{{ t('app.error_title') }}</p>
    <template v-if="apierror">
      <ul v-if="apimessage">
        <li v-for="error in errors[0].message" :key="error.id">
          ▪️ {{ error }}
        </li>
      </ul>
      <p v-else>
        {{ errors[0].message }}
      </p>
    </template>
    <template v-else>
      <p v-if="errors[0] !== 'The given data was invalid.'">
        {{ errors[0] }}
      </p>
      <template v-if="display(errors[1])">
        <ul v-for="errorsList in errors[1]" :key="errorsList.id">
          <li v-for="error in errorsList" :key="error.id">
            ▪️ {{ error }}
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// `errors` is intentionally loosely typed: the legacy contract is a positional
// tuple — index 0 is either a string banner or an ApiError envelope, index 1 is
// the laravel-422 nested validation map. Strict typing here would just push
// runtime casts into the template.
type ErrorList = any[];

const props = withDefaults(
  defineProps<{
    errors?: ErrorList;
  }>(),
  {
    errors: () => [],
  },
);

const { t } = useI18n();

const apierror = computed(() => {
  const first = props.errors[0];
  return typeof first === 'object' && first !== null && first.error_code !== undefined;
});

const apimessage = computed(() => {
  const first = props.errors[0];
  return typeof first === 'object' && first !== null && Array.isArray(first.message);
});

function display(val: unknown): boolean {
  return typeof val === 'object' && val !== null;
}
</script>
