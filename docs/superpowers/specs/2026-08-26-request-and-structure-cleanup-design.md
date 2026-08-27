# Request and Structure Cleanup Design

## Goal

Remove repeated backend lookups, duplicate frontend requests, stale Effect closures, duplicated HTTP/log-page implementations, and the most consequential deviations from the shared page structure without changing user-facing business behavior.

## Design

- Cache active sensitive-field definitions and batch Redis permission checks per response. Invalidate the cache after sensitive-field mutations.
- Cache the authenticated user projection briefly by token user id. Authorization continues to receive roles and department, and mutation/logout paths invalidate the cached projection.
- Introduce one list-query state helper. Search submits explicit filters, reset submits an empty query, and pagination produces exactly one request without timers.
- Load system configuration and user menus once in the authenticated layout and expose them through context. Header, Sidebar, and Dashboard consume the same state.
- Stabilize dynamic-form schema/default values and use controlled fields instead of registration Effects. DateTimePicker changes a value only after an explicit selection.
- Build Axios clients through one factory and make the public base URL fallback deterministic. API modules remain the response-contract boundary.
- Keep `/logs` as the canonical log page and redirect `/setting/logs` to it.
- Split only responsibilities touched by this work; unrelated large monitoring and generator files are not mechanically divided.

## Constraints

- Preserve existing routes, permissions, styling, and response envelopes except for the obsolete `/setting/logs` implementation, which becomes a redirect.
- Preserve existing uncommitted log audit files and `frontend/package-lock.json`.
- No browser-based validation.
- Add focused regression tests for request-state transitions, cache behavior, shared layout data, and date/form behavior.
