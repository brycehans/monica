@if(session('success'))

<div class="page-alert page-alert-success" :timeout="4000">
  {{ session('success') }}
</div>

@endif
