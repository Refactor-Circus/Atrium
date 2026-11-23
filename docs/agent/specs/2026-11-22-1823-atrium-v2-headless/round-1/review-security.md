VERDICT: CHANGES

Security review, round 1. Authorize fails closed (401 JSON on a null user, 403 off local), ClientPath and the layer link check reject the listed bypass forms, layout uuids are scoped to the dashboard, widget binding is scoped, the version lock is a conditional update, JsonData hides resolver errors outside local/testing, and the workbench token guard is local-only and marked workbench-only.

Findings
- minor: IndexSearchResultRequest validates q with min:N before trimming, so whitespace padding passes min_length, and q has no max length (every search source gets an unbounded string). Fix: add max:255 (or a configurable cap) and trim before validating (prepareForValidation or the TrimStrings middleware), then keep the min check on the trimmed value. File: src/Domains/Search/Http/Requests/IndexSearchResultRequest.php
