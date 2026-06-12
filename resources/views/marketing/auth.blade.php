<!DOCTYPE html>
<html lang="{{ \App::getLocale() }}" dir="{{ htmldir() }}">
  <head>
    <base href="{{ url('/') }}/" />
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>@yield('title', trans('app.application_title'))</title>
    <link rel="manifest" href="manifest.webmanifest">

    <script type="application/json" id="boot-data">{!! \Safe\json_encode([
        'locale' => \App::getLocale(),
        'htmldir' => htmldir(),
    ]) !!}</script>
    @vite(['resources/sass/app-' . htmldir() . '.scss', 'resources/js/app.ts'])
    <link rel="shortcut icon" href="img/favicon.png">
  </head>

  <body data-account-id={{ auth()->user()->account_id }} class="marketing register bg-gray-monica">

      <div id="app">
        <modals-container></modals-container>
        @yield('content')
      </div>

    @stack('scripts')

  </body>
</html>
