VERDICT: CHANGES

# Standards review, round 1

1. major, architecture/dependencies: ShowShellRequest (Navigation) calls IndexSearchResultRequest::minLength() (Search Http request), and ShellResource (Navigation) imports Settings Http SettingsPanelResource. A domain may depend on another domain Contracts, Data and models, not its Http classes. Fix: move minLength() to a Search service/Data seam (for example SearchRegistry) used by both the search request and the shell; build the shell panel summaries without importing another domain resource, or share it from a top-level src/Http/Resources.

2. minor, http/request-persist: ShellController, DashboardController::default and similar serve ShowShellRequest and ShowDefaultDashboardRequest. The controller method default() does not match a request verb (Index/Store/Show/Update/Delete). Consider a verb-matching name.

Decision: ShowShellRequest, IndexSearchResultRequest, IndexSettingsPanelRequest and ShowSettingsPanelRequest inherit authorize() true from the base, which request-persist says every concrete request overrides with a policy check. No model exists to check; the route gate decides. Record a standards-feedback row or accept.
