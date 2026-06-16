{{-- Version check trigger (rendered in partials.footer, outside #app).
     The matching modal is partials.check-modal, mounted inside #app where Vue
     can process its bindings. The two pieces communicate via the custom DOM
     event 'monica:show-version-modal' — the root Vue app (resources/js/app.ts)
     listens for it on document. --}}

@if (config('monica.check_version'))

    @if (($version = config('monica.app_version')) !== '' && version_compare($instance->latest_version, $version) > 0)
    <li>
        <a href="" class="badge badge-success" onclick="document.dispatchEvent(new CustomEvent('monica:show-version-modal')); return false;">{{ trans('app.footer_new_version') }}</a>
    </li>
    @endif

@endif
