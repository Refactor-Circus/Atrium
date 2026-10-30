<p>{{ $marker ?? 'marker' }} on {{ $screen->key }} for {{ $record instanceof \Illuminate\Database\Eloquent\Model ? $record->name : 'no record' }} with {{ $tab }} open</p>
