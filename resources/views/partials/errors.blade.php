@if (isset($errors))
  @if (count($errors) > 0)
    <div class="page-alert page-alert-danger">
      <ul>
        @foreach ($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    </div>
  @endif
@endif