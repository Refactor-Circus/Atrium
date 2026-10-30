@props(['data'])

<p>component data: {{ implode(',', array_keys($data)) }} = {{ implode(',', $data) }}; {{ isset($screen) || isset($record) || isset($tab) ? 'host variables leaked' : 'data only' }}</p>
