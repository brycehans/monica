{{-- Version check modal (mounted inside #app so Vue can drive it).
     Trigger lives in partials.check (rendered by partials.footer); see that
     file for the event-based bridge between the two DOM scopes. --}}

@if (config('monica.check_version'))

    @if (($version = config('monica.app_version')) !== '' && version_compare($instance->latest_version, $version) > 0)
    <monica-modal v-model="show_version_modal" title="{{ trans('app.footer_modal_version_whats_new') }}">
      <div class="show-version">
        <p>{{ trans_choice('app.footer_modal_version_release_away', $instance->number_of_versions_since_current_version, ['number' => $instance->number_of_versions_since_current_version]) }}</p>
        {!! $instance->latest_release_notes !!}
      </div>
      <template #button>
        <button type="button" class="btn btn-secondary" @click="show_version_modal = false">{{ trans('app.close') }}</button>
      </template>
    </monica-modal>
    @endif

@endif
