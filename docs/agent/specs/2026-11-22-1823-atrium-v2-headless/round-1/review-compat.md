VERDICT: CHANGES

Every break in this diff is either listed in the spec or recorded in D-001 to D-017, and the CHANGELOG v2.0.0 guide documents it. That covers the removed config keys, routes, Blade and CSS, `view()`, `Icons`, `Atrium::path()/url()`, `DashboardManager` methods, and the publish tags. It also covers the placement uuid and dashboard version columns, full-layout saves, the 401/403 behaviour of `Authorize`, and the `link` shape. I found one gap in the upgrade guide, listed below.

- minor: the CHANGELOG does not list two removed public members of `Domains\Search\Http\Controllers\SearchController`.
  - `SearchController::minLength()` is gone. It was a public static method that other code could call.
  - The controller is now `final`, and its invokable `__invoke` became `index()`. A host that routes to it or subclasses it breaks.
  - Fix: add both to the "Removed" section of the v2.0.0 CHANGELOG. For `minLength()`, name the replacement as `config("atrium.search.min_length")`, now enforced by `IndexSearchResultRequest`. Add a line for the new `DashboardManager` constructor dependencies (`PlacementResolver`, `PackageRegistry`), which affect any subclass or manual construction.
  - Files: CHANGELOG.md, src/Domains/Search/Http/Controllers/SearchController.php, src/Domains/Dashboard/Services/DashboardManager.php
