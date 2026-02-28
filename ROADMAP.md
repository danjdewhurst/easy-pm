# easy-pm Roadmap

Last reviewed: 2026-02-28

## Current Snapshot

### What’s already strong
- Solid baseline architecture: shared types/validation, API, CLI, and React UI in one Bun app.
- Good integration coverage: API + CLI + validation tests are in place and passing.
- Core Kanban flow works end-to-end (projects → boards → columns → cards).
- Auth/session model and user-level data isolation are already implemented.
- Recent delivery pace is strong (v1.0.0 and v1.1.0 shipped the same day).

### Immediate issues discovered
- `bun test` passes (127/127), but `bun run typecheck` currently fails with extensive TypeScript environment/config issues.
- `bun run lint` did not run because typecheck failed first.
- Type errors indicate the compiler cannot resolve Bun/Node/React ambient types in the current TS setup.

---

## Priorities

1. **Stabilise engineering quality gates** (typecheck + lint must be green)
2. **Harden API/CLI ergonomics and reliability**
3. **Improve board UX and productivity features**
4. **Prepare for multi-user collaboration + operational readiness**

---

## Phase 1 — Build & Tooling Foundation (P0)

### 1.1 Fix TypeScript configuration and runtime typing
- [ ] Align `tsconfig.json` with Bun + React + Node usage.
- [ ] Ensure global types are available (`Bun`, `process`, JSX, `bun:test`, `bun:sqlite`, `node:*` imports).
- [ ] Remove/resolve implicit `any` hotspots in frontend event handlers and callbacks.
- [ ] Ensure module resolution handles `index.html` import in server entry.

**Exit criteria**
- [ ] `bun run typecheck` passes in a clean checkout.

### 1.2 Reinstate full quality gate pipeline
- [ ] Run and fix `bun run lint` findings.
- [ ] Add a single `bun run check` script (test + typecheck + lint) for local/CI parity.
- [ ] Update CI workflow to enforce the same gate order.

**Exit criteria**
- [ ] CI fails on any test/type/lint regression.
- [ ] Local and CI outcomes match.

### 1.3 Tighten developer onboarding
- [ ] Add “first run” and “quality checks” section to README.
- [ ] Document expected Bun version and environment assumptions.
- [ ] Add troubleshooting section for common Bun/TS type resolution failures.

---

## Phase 2 — API & Data Reliability (P1)

### 2.1 Strengthen API behaviour contracts
- [ ] Add request/response examples for all endpoints in `docs/api.md`.
- [ ] Standardise error codes/messages for client-friendly handling.
- [ ] Add pagination strategy for list endpoints before dataset growth hurts UX.

### 2.2 Improve migration safety
- [ ] Add migration smoke tests covering upgrade from v1.0.0 DB state to latest.
- [ ] Add rollback/backup guidance for self-hosters.
- [ ] Introduce migration idempotency checks in CI.

### 2.3 Security hardening pass
- [ ] Add rate-limiting on auth endpoints.
- [ ] Add optional session revocation-all and password change flow.
- [ ] Audit input boundaries and large payload protections.

---

## Phase 3 — Product UX Improvements (P1)

### 3.1 Board usability
- [ ] Add inline column/card rename shortcuts.
- [ ] Add keyboard shortcuts for create/search/move flows.
- [ ] Add card due-date visual states (today/overdue/upcoming).

### 3.2 Filtering & search
- [ ] Add board-level filters (label, assignee/creator, due window).
- [ ] Add saved views per board.
- [ ] Extend search to include label names and optional description weighting.

### 3.3 Card detail enhancements
- [ ] Add activity history timeline (created, moved, edited).
- [ ] Add comments with markdown-lite support.
- [ ] Add richer estimate analytics (column/board total effort).

---

## Phase 4 — CLI & Agentic Workflow Excellence (P1)

### 4.1 CLI ergonomics
- [ ] Improve help text and examples for every command.
- [ ] Add shell completion generation (bash/zsh).
- [ ] Add `--quiet` and structured error fields in JSON mode.

### 4.2 Automation-friendly features
- [ ] Add bulk operations (`card move --ids`, `label apply --query`).
- [ ] Add idempotent command patterns for CI/agent use.
- [ ] Add import/export commands (JSON/CSV).

### 4.3 Non-interactive auth support
- [ ] Add token-from-env support and explicit token profile handling.
- [ ] Add optional machine token creation flow for automation.

---

## Phase 5 — Collaboration & Scale Readiness (P2)

### 5.1 Multi-user collaboration baseline
- [ ] Add project membership roles (owner/editor/viewer).
- [ ] Enforce role-based permissions across API + UI + CLI.
- [ ] Add invitation flow.

### 5.2 Real-time updates
- [ ] Add SSE/WebSocket updates for board changes.
- [ ] Implement optimistic UI conflict handling.
- [ ] Add reconnect and event replay strategy.

### 5.3 Operational readiness
- [ ] Add structured logging and request IDs.
- [ ] Add metrics endpoint and basic dashboard docs.
- [ ] Publish deployment guide (reverse proxy + TLS + backups).

---

## Testing Roadmap

- [ ] Keep integration tests as baseline; add performance and migration tests.
- [ ] Add frontend interaction tests for drag/drop and keyboard flows.
- [ ] Add auth/security regression tests (session expiry, revoked tokens).
- [ ] Add smoke e2e scenario (register → create project → board → card → search).

---

## Suggested Milestones

### v1.1.1 (stability patch)
- Typecheck green
- Lint green
- CI quality gate parity
- README onboarding fixes

### v1.2.0 (reliability + UX)
- Pagination + API docs expansion
- Migration safety tests
- Board filtering + due-date states

### v1.3.0 (agentic + collaboration groundwork)
- CLI bulk/idempotent operations
- Membership model foundations
- Observability baseline

---

## Definition of Done (for roadmap items)

- [ ] Feature documented in `README.md` or relevant `docs/*.md`
- [ ] Tests added/updated at the right layer (unit/integration/e2e)
- [ ] `bun test`, `bun run typecheck`, and `bun run lint` all pass
- [ ] Changelog entry included for user-facing changes
