# Standards for Fix SearchTest process-driver failures under --prefer-lowest

| Standard | File | Source | Why it applies |
| --- | --- | --- | --- |
| architecture/dependencies | vendor/refactor-circus/standards/standards/architecture/dependencies.md | refactor-circus/standards@dev-main | Composer constraints change; runtime `require` stays untouched and dev-only packages stay out of it |
| testing/test-layers | vendor/refactor-circus/standards/standards/testing/test-layers.md | refactor-circus/standards@dev-main | Process-driver behaviour stays tested at the Search surface; no new layer |
