<!DOCTYPE html>
<html lang="{{ \App::getLocale() }}" dir="{{ htmldir() }}">
  <head>
    <base href="{{ url('/') }}/" />

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="apple-mobile-web-app-title" content="Monica">
    <meta name="application-name" content="Monica">
    <meta name="theme-color" content="#325776">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>@yield('title', trans('app.application_title'))</title>

    <link rel="manifest" href="manifest.webmanifest">

    @vite(['resources/sass/app-' . htmldir() . '.scss'])
    {{-- Required only for the Upgrade account page --}}
    @if (Route::currentRouteName() == 'settings.subscriptions.upgrade' || Route::currentRouteName() == 'settings.subscriptions.confirm')
      @vite(['resources/sass/stripe.scss', 'resources/js/stripe.ts'])
    @endif

    <link rel="shortcut icon" href="img/favicon.png">

    <link rel="apple-touch-icon" href="img/icons/touch-icon-iphone.png">
    <link rel="apple-touch-icon" sizes="152x152" href="img/icons/touch-icon-ipad.png">
    <link rel="apple-touch-icon" sizes="180x180" href="img/icons/touch-icon-iphone-retina.png">
    <link rel="apple-touch-icon" sizes="167x167" href="img/icons/touch-icon-ipad-retina.png">

    <link rel="shortcut icon" sizes="196x196" href="img/icons/favicon-196.png">

    <script type="application/json" id="boot-data">{!! \Safe\json_encode([
        'locale' => \App::getLocale(),
        'htmldir' => htmldir(),
        'profileDefaultView' => auth()->user()->profile_active_tab,
        'timezone' => auth()->user()->timezone,
        'env' => \App::environment(),
    ]) !!}</script>
  </head>
  <body data-account-id="{{ auth()->user()->account_id }}" class="bg-gray-monica min-vh-100 flex flex-column">

    <div id="app" class="flex-grow-1">
      <modals-container></modals-container>
      @if (Route::currentRouteName() != 'settings.subscriptions.confirm')
        @include('partials.header')
        @include('partials.subscription')
        @include('partials.check-modal')
      @endif
      @yield('content')
    </div>

    @if (Route::currentRouteName() != 'settings.subscriptions.confirm')
      @include('partials.footer')
    @endif

    {{-- Load app JS everywhere except on the Upgrade and Confirm subscription pages
         (those load stripe.js via the @vite() call in <head> instead). --}}
    @if (Route::currentRouteName() != 'settings.subscriptions.upgrade' && Route::currentRouteName() != 'settings.subscriptions.confirm')
      @push('scripts')
        @vite(['resources/js/app.ts'])
      @endpush
    @endif

    @stack('scripts')

  </body>
</html>
