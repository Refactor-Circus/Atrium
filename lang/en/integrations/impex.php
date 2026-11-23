<?php

declare(strict_types=1);

/*
 * The Impex integration's server-side labels: its nav items, widgets,
 * settings panel and search source. The layer's own Impex strings live in
 * `nuxt/layer/i18n/locales/integrations/impex.en.json`.
 */

return [

    'label' => 'Impex',

    'nav' => [
        'group' => 'Impex',
        'runs' => 'Runs',
        'messages' => 'Messages',
        'flows' => 'Flows',
        'channels' => 'Channels',
        'subscriptions' => 'Subscriptions',
    ],

    'widgets' => [
        'run_status' => 'Run status',
        'run_status_description' => 'How many runs sit in each state right now.',
        'recent_failures' => 'Recent failures',
        'recent_failures_description' => 'Runs that failed most recently.',
        'message_volume' => 'Message volume',
        'message_volume_description' => 'Messages recorded over the last day.',
    ],

    'settings' => [
        'label' => 'Impex',
        'description' => 'Retention, limits and artifact storage for the workflow engine.',
    ],

    'search' => [
        'label' => 'Impex runs',
    ],

];
