<!DOCTYPE html>
<html lang="{{ \App::getLocale() }}" dir="{{ htmldir() }}">
  <head>
    <base href="{{ url('/') }}/" />
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>@yield('title', trans('app.application_title'))</title>
    <link rel="manifest" href="manifest.webmanifest">

    @vite(['resources/sass/app-' . htmldir() . '.scss', 'resources/js/app.js'])
    <link rel="shortcut icon" href="img/favicon.png">
    <script>
      window.Laravel = {!! \Safe\json_encode([
          'locale' => \App::getLocale(),
          'htmldir' => htmldir(),
      ]); !!}
    </script>
  </head>

  <body data-account-id={{ auth()->user()->account_id }} class="marketing register bg-gray-monica">

      <div id="app">
        @yield('content')
      </div>

    @stack('scripts')

  </body>
</html>
