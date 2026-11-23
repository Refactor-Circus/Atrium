VERDICT: PASS

Standards review, round 1. No findings at or above minor.

Checked: every controller method is a single `return $request->persist();`. All resources are final and extend Keystone JsonResource, placed per domain-modules (beside the model or in Http/Resources). UnserializableDataException is final, extends AtriumException and has status 500. Placement uuid uses HasUuids on uuid only. Departures from architecture/dependencies, architecture/domain-modules and http/authorization are recorded in docs/agent/standards-feedback.md.
