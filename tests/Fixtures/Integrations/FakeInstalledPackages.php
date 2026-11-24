<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures\Integrations;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;

/**
 * Reports exactly the given packages installed, each with its suite manifest
 * (or the fixture manifest `IntegrationFixture::fake()` swapped in), in place
 * of the packages Composer installed in the real vendor directory.
 */
final class FakeInstalledPackages implements InstalledPackages
{
    /**
     * @param  list<string>  $keys  Package keys, such as `cortex`.
     */
    public function __construct(private readonly array $keys = []) {}

    public function integrations(): array
    {
        $integrations = [];

        foreach ($this->keys as $key) {
            $integrations[$key] = IntegrationFixture::manifestFor($key);
        }

        return $integrations;
    }
}
