@if ($paginator->hasPages())
    <ul class="pager inline-flex">
        {{-- Previous Page Link --}}
        @if ($paginator->onFirstPage())
            <li class="pager-item disabled"><span class="pager-link">&laquo;</span></li>
        @else
            <li class="pager-item"><a class="pager-link" href="{{ $paginator->previousPageUrl() }}" rel="prev">&laquo;</a></li>
        @endif

        {{-- Pagination Elements --}}
        @foreach ($elements as $element)
            {{-- "Three Dots" Separator --}}
            @if (is_string($element))
                <li class="pager-item disabled"><span class="pager-link">{{ $element }}</span></li>
            @endif

            {{-- Array Of Links --}}
            @if (is_array($element))
                @foreach ($element as $page => $url)
                    @if ($page == $paginator->currentPage())
                        <li class="pager-item active"><span class="pager-link">{{ $page }}</span></li>
                    @else
                        <li class="pager-item"><a class="pager-link" href="{{ $url }}">{{ $page }}</a></li>
                    @endif
                @endforeach
            @endif
        @endforeach

        {{-- Next Page Link --}}
        @if ($paginator->hasMorePages())
            <li class="pager-item"><a class="pager-link" href="{{ $paginator->nextPageUrl() }}" rel="next">&raquo;</a></li>
        @else
            <li class="pager-item disabled"><span class="pager-link">&raquo;</span></li>
        @endif
    </ul>
@endif
