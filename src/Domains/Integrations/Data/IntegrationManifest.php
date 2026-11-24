<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Data;

use stdClass;

/**
 * An integration manifest (D-090) as read and checked: the package's key,
 * where it was read from, and its JSON, decoded without `assoc` (objects as
 * `stdClass`). Registration reads its labels and expressions then.
 */
final class IntegrationManifest
{
    /**
     * @internal Built by IntegrationManifests.
     */
    public function __construct(
        public private(set) string $key,
        public private(set) string $source,
        public private(set) stdClass $json,
    ) {}
}
