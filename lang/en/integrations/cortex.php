<?php

declare(strict_types=1);

/*
 * The server-side labels of the Cortex integration: its nav items, settings
 * panel and search source, ported from Cortex v1's `cortex::cortex` lines.
 * The layer's own strings for the Cortex pages live in
 * `nuxt/layer/i18n/locales/integrations/cortex.en.json`.
 */

return [

    'label' => 'Cortex',

    // Navigation
    'virtual_agents' => 'Virtual agents',
    'concrete_agents' => 'Concrete agents',
    'run_agent' => 'Run agent',
    'tools' => 'Tools',
    'servers' => 'Servers',
    'redirect_domains' => 'Redirect domains',

    // Settings panel
    'settings_label' => 'Cortex',
    'settings_description' => 'Providers, tools, concrete agents and MCP servers available to your agents.',

    // Search source
    'search_label' => 'Cortex',

];
