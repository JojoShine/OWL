# Request and Structure Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate repeated requests and unstable Effect flows while consolidating shared data and request infrastructure.

**Architecture:** Backend hot-path metadata is cached and permission checks are batched. Frontend list state and authenticated-layout data become single sources of truth, while HTTP clients and duplicate routes are consolidated.

**Tech Stack:** Express, Sequelize, Redis, Jest, Next.js, React 19, React Hook Form, Axios, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-request-and-structure-cleanup-design.md`

## Global Constraints

- Preserve business behavior and current UI styling.
- Do not alter unrelated uncommitted files.
- Use focused automated checks; do not use browser validation.

---

### Task 1: Backend masking hot path

**Files:** `backend/src/middlewares/dataMasking.js`, `backend/src/core/modules/data-security/plain-access.service.js`, focused Jest tests.

- [ ] Add failing tests for cached sensitive-field definitions and batched permission reads.
- [ ] Implement TTL caching, explicit invalidation, and Redis `mGet` permission resolution.
- [ ] Verify focused backend tests.

### Task 2: Authentication lookup cache

**Files:** `backend/src/middlewares/auth.js`, user/role mutation services or routes, focused Jest tests.

- [ ] Add failing tests for repeated authentication using one user lookup and cache invalidation.
- [ ] Implement a short-lived bounded user cache shared by required and optional authentication.
- [ ] Invalidate on security-relevant user mutations and verify tests.

### Task 3: Deterministic frontend list requests

**Files:** new list-query utility/hook, `DynamicCrudPage.jsx`, standard list pages, Vitest tests.

- [ ] Add failing tests for search, reset, pagination, and stale-response behavior.
- [ ] Implement explicit applied-filter state with no request timers.
- [ ] Migrate duplicated pages and verify focused tests/lint.

### Task 4: Authenticated layout shared data

**Files:** new layout context, authenticated layout, Header, Sidebar, Dashboard, NotificationIcon, component tests.

- [ ] Add failing tests proving configuration/menu fetch once and no initial notification reconnect duplicate.
- [ ] Implement shared context and consume it from layout children.
- [ ] Verify layout tests.

### Task 5: Stable form Effects

**Files:** `DynamicForm.jsx`, `date-time-picker.jsx`, focused component tests.

- [ ] Add failing tests for stable defaults and no value mutation on picker open.
- [ ] Memoize derived form structures and use controlled non-native fields.
- [ ] Verify focused tests and Hook lint.

### Task 6: Request clients and duplicate logs route

**Files:** Axios client utilities, API modules where needed, `/setting/logs/page.js`, tests.

- [ ] Add failing tests for base URL fallback and response handling.
- [ ] Introduce a shared Axios client factory and migrate three clients.
- [ ] Replace duplicate log page with a redirect and verify route contracts.

### Task 7: Final structural cleanup

**Files:** files touched above and project contract tests.

- [ ] Remove dead compatibility branches, unused imports, and obsolete timers.
- [ ] Run focused backend/frontend tests, source lint, and builds.
- [ ] Review the final diff against the specification.
