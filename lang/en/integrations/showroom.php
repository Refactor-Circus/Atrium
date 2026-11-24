<?php

declare(strict_types=1);

/*
 * The Showroom integration's server-side labels: its nav items, widgets,
 * settings panel and search source, ported from Showroom's v1 `showroom::`
 * strings. The module's own Showroom strings live in
 * `ui/modules/showroom/src/locales/showroom*.en.json`.
 */

return [

    'label' => 'Showroom',

    'nav' => [
        'group' => 'Catalog',
        'products' => 'Products',
        'product_models' => 'Product models',
        'categories' => 'Categories',
        'assets' => 'Assets',
        'owners' => 'Owners',
        'families' => 'Families',
        'attributes' => 'Attributes',
        'attribute_groups' => 'Attribute groups',
        'channels' => 'Channels',
        'association_types' => 'Association types',
        'transfers' => 'Import & export',
    ],

    'widgets' => [
        'product_status' => 'Products by status',
        'product_status_description' => 'How many products sit in each review state, and how many are live.',
        'completeness' => 'Completeness',
        'completeness_description' => 'Average completeness and fully complete products per channel and locale.',
        'review_queue' => 'Review queue',
        'review_queue_description' => 'Products waiting for review, oldest first.',
        'recent_changes' => 'Recent changes',
        'recent_changes_description' => 'The latest product edits, transitions and reverts.',
    ],

    'settings' => [
        'label' => 'Showroom',
        'description' => 'How the catalog is exposed over HTTP and MCP.',
    ],

    'search' => [
        'label' => 'Showroom',
    ],

];
