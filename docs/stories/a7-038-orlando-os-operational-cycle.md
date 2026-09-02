# Story A7-038 — A7 Orlando OS Operational Cycle

**Status:** Ready for Staging gate — local implementation and isolated SQL validation complete; no external mutation performed

**Created:** 2026-09-01

**Source:** Owner-supplied Goal “Fechar o ciclo operacional end-to-end do A7 Orlando OS”, 2026-09-01

**Depends on:** A7-019, A7-020, A7-023, A7-027, A7-033, A7-034, A7-035 and A7-037

## Story

**As a** trained A7 Orlando operator or manager,

**I want** the system to expose the single valid next operational action and keep lifecycle, custody, production and finance independent,

**so that** I can complete an order from accepted sale through delivery and payment without parallel operational controls or Owner memory.

## Decision and scope lock

This story connects the current UI to the existing four-axis architecture. It does not redesign the system or merge independent state axes.

In scope:

- server-authoritative next actions and transition validation;
- mandatory `promised_at` for Express, with an eight-hour suggestion and operator adjustment;
- truthful pickup and delivery lateness, distinguishing risk from overdue;
- manual payment registration for Stripe, Cash, Zelle or Other without mutating operational axes;
- a minimal active/inactive driver directory and pickup/delivery responsibility assignment;
- final weight capture and explicit minimum-order calculation;
- the bounded trust fixes named in the Goal;
- CLI/service contracts before API/UI;
- a complete controlled Staging scenario before any Production decision.

Out of scope:

- route optimization, maps, GPS, ETAs, driver apps, shifts or payroll;
- WhatsApp automation, CRM expansion, SSO/IAM expansion or configurable RBAC;
- new dashboards, campaign changes, Stripe Live mutations or changes to attribution;
- deletion or rewriting of historical operational, invoice, payment or audit records.

## Requirement traceability

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Return only the valid next operational action for the current four-axis state; impossible and duplicate transitions fail server-side. | Goal §1 |
| FR-02 | Every executed transition records actor, UTC time, before/after state, idempotency and timeline evidence. | Goal §1 |
| FR-03 | Express cannot proceed without an operator-confirmed promised delivery; the system suggests pickup plus eight hours and permits an audited correction. | Goal §2 |
| FR-04 | Express renders remaining time, Attention, Risk and Late using the approved 4h/2h rule. | Goal §2; A7-019 approved SLA |
| FR-05 | An order is overdue only when an unmet pickup or delivery obligation has expired; risk and overdue remain distinct. | Goal §3 |
| FR-06 | Authorized staff can register a manual payment with method, value, occurred-at and optional note; only the financial axis changes. | Goal §4 |
| FR-07 | Manual payment records actor/audit evidence and immediately updates Order, Home and Finance reads. | Goal §4 |
| FR-08 | Paid invoices remain immutable; exact retries are idempotent and conflicting duplicate payment facts fail closed. | Goal §4 |
| FR-09 | Owner manages a minimal driver directory with name, phone and active/inactive status; inactive drivers remain historical but cannot receive new assignments. | Goal §5 |
| FR-10 | Owner/Manager assigns an active driver independently for pickup or delivery; order detail shows the current physical responsibility. | Goal §5 |
| FR-11 | Final per-item weight recalculates service value using existing pricing/minimum rules and displays base calculation, minimum adjustment, total service and zero tip explicitly. | Goal §6 |
| FR-12 | Home card counts and their drill-downs use the same full governed universe; ready excludes delivered and leads are actionable. | Goal trust fixes |
| FR-13 | Phone input is normalized/validated internationally, existing customers are suggested, pickup documents use the real collection location and internal enums never render raw. | Goal trust fixes |
| FR-14 | Forms warn before losing dirty input, system views do not stack, and the hotel directory reuses existing canonical data. | Goal trust fixes |
| NFR-01 | CLI/service precede API/UI and the browser does not own business rules. | Constitution I; Goal principle |
| NFR-02 | All writes are same-origin, authenticated, role-authorized, idempotent and audited; PII/secrets stay out of URLs, analytics and logs. | Goal §§1,4,5 |
| NFR-03 | Database changes are additive; application rollback leaves new objects inert and preserves historical truth. | Goal architecture principle |
| NFR-04 | Unknown remains unknown; no amount, payment, deadline, driver or state is inferred. | Goal §§2–6 |
| CON-01 | Lifecycle, custody, production and finance remain independent. | Goal principle |
| CON-02 | No real charge, refund, Stripe Live change, WhatsApp change or campaign change is authorized. | Goal exclusions |
| CON-03 | Production remains unchanged until the complete Staging scenario passes and a later explicit cutover is authorized. | Goal Definition of Done |

## Governed operational contract

### Next-action sequence

```text
Express promise when absent
→ schedule pickup
→ assign pickup driver
→ confirm pickup
→ receive at laundry
→ record final weight
→ start processing
→ mark ready
→ assign delivery driver
→ start delivery
→ direct or Bell Desk final confirmation
```

Payment is deliberately independent from production. It may be recorded before or after production without advancing custody or production. The existing normal policy still requires a paid, invoiced order before delivery starts; this story does not silently introduce a delivery-without-payment exception. Invoice prerequisites and immutable paid-invoice rules still apply.

### Driver responsibility

- Pickup assignment means the selected active driver is responsible for collection.
- Delivery assignment means the selected active driver is responsible for return.
- Assignment alone changes no lifecycle, custody, production or finance state.
- Completing the relevant handoff preserves the assignment in history.
- Deactivating a driver prevents future assignment but never rewrites earlier responsibility.

### Manual payment

- Methods: `stripe`, `cash`, `zelle`, `other`.
- Value must be positive USD and must match the current payable service amount unless an existing governed exception explicitly permits otherwise.
- Tip is stored separately and defaults to exactly `0.00`; this story does not infer tip from overpayment.
- The payment record is append-only/idempotent and marks only `payment_status=paid` with the existing payment lifecycle authority.
- The action never changes custody, production or delivery state.

### Lateness

- Pickup overdue: pickup window end is past while custody is still `with_customer` or `awaiting_pickup`.
- Delivery overdue: `promised_at`/`needed_by` is past and custody is not `delivered`.
- Express risk uses the approved 4h/2h thresholds before the promise; overdue begins at zero.

## Acceptance criteria

- [ ] **AC-01 — Guided action.** No active valid order receives a generic operational-review button; it receives one executable next action or a precise non-actionable blocker.
- [ ] **AC-02 — Transition authority.** Valid transitions succeed once; impossible transitions and exact/conflicting retries behave deterministically with complete audit evidence.
- [ ] **AC-03 — Express promise.** Express creation suggests pickup plus eight hours, permits operator adjustment, requires confirmation before order acceptance and stores the promise.
- [ ] **AC-04 — SLA truth.** OK, Attention, Risk and Late render with deterministic remaining/elapsed time, and pickup/delivery overdue rules test independently.
- [ ] **AC-05 — Driver directory.** Owner can create/update/activate/deactivate drivers; Manager can read active drivers and assign them; Operator receives only the permissions explicitly granted by the existing RBAC contract.
- [ ] **AC-06 — Responsibility.** Pickup and delivery assignments show the selected driver and leg, do not mutate the four axes and preserve historical assignment after completion/deactivation.
- [ ] **AC-07 — Manual payment.** Authorized registration records method/value/time/note/actor, changes only finance, is idempotent and immediately reconciles Order, Home and Finance.
- [ ] **AC-08 — Independent states.** `PAID+PROCESSING`, `UNPAID+READY`, `PAID+WITH_DRIVER` and `READY+PAYMENT_PENDING` remain valid and navigable.
- [ ] **AC-09 — Invoice integrity.** Paid invoice facts cannot be edited or voided; a duplicate/conflicting manual payment cannot rewrite them.
- [ ] **AC-10 — Weight/pricing.** Final weight shows the exact multiplication, governed minimum adjustment, service total and `Tip = $0.00` without hiding minimum application.
- [ ] **AC-11 — Home reconciliation.** Every Home card opens the exact complete queue it counts; Ready excludes delivered and actionable lead rows open the correct existing workflow.
- [ ] **AC-12 — Input trust.** International phone validation, existing-customer suggestion, real pickup location, friendly enum labels, dirty-form protection and single-view rendering pass desktop and 390px checks.
- [ ] **AC-13 — Hotel reuse.** Existing canonical hotel records populate the selection source without duplicating known hotel aliases.
- [ ] **AC-14 — Security/privacy.** Role, same-origin, PII, secret and audit gates pass for every new endpoint and payload.
- [ ] **AC-15 — Quality.** Focused tests, lint, typecheck, full tests and build pass; story checklist and file list are current.
- [ ] **AC-16 — Staging E2E.** A trained user completes the exact Goal scenario with a full timeline, updated Home/Finance and no test residue or external financial mutation.

## Tasks

- [x] Audit the current four-axis services, migrations, Home and UI against the supplied Goal.
- [x] Freeze state/action/payment/driver/SLA contracts in focused tests.
- [x] Add the minimal additive schema and guarded rollback for drivers, assignments and manual payments.
- [x] Implement CLI/service operations and prove them before API/UI.
- [x] Add private role-authorized APIs.
- [x] Replace the generic action presentation and add Express, driver and payment controls.
- [x] Apply the bounded trust fixes and dirty-form/single-view contracts.
- [x] Run all local quality gates, build the isolated artifact and document rollback evidence.
- [ ] Execute the complete authenticated Staging E2E only after an exact Staging target and authorization are supplied.

## Rollback

Application rollback restores the immutable deployment recorded before cutover. Additive tables, columns, functions and events remain inert. SQL rollback is exceptional and may remove new database objects only when no non-QA driver assignment or manual payment history exists. Historical audit evidence is never deleted merely to simplify rollback.

## Validation evidence

- Focused operational/customer/order tests: `45/45 PASS`.
- Repository quality gate: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — all `PASS` on 2026-09-02.
- The Orlando migration chain from `20260827010000` through `20260901040000` applied successfully to a disposable local Supabase stack on isolated ports.
- `supabase db lint --local --level warning` returned no new A7-038 warning; three pre-existing unused-variable warnings remain in W1B/W1C-A functions.
- Transactional driver RPC probe returned one active driver and was rolled back; the disposable stack was stopped without backup.
- The repository-wide blank-database chain still has a pre-existing unrelated blocker at `20260325_payments_utm.sql` because that legacy migration assumes a `payments` table. This does not affect the isolated Orlando chain, but remains repository migration debt.
- No Supabase remote, Vercel, Stripe, WhatsApp, Google Ads, commit, push or deploy mutation was performed.

## File list

- `docs/stories/a7-038-orlando-os-operational-cycle.md`
- `lib/system-operational-cycle-service.js`
- `lib/system-operations-service.js`
- `lib/system-order-service.js`
- `lib/system-home-service.js`
- `lib/operational-store.js`
- `api/system/drivers.js`
- `api/system/manual-payment.js`
- `api/system/customers.js`
- `api/system/orders.js`
- `scripts/a7-system-operational-cycle.mjs`
- `scripts/test-system-operational-cycle.mjs`
- `scripts/test-system-home.mjs`
- `scripts/test-system-w0-w1a.mjs`
- `scripts/test-system-w1b.mjs`
- `scripts/test-system-w3-a.mjs`
- `sistema.html`
- `sistema.js`
- `sistema.css`
- `supabase/migrations/20260901040000_orlando_os_operational_cycle.sql`
- `supabase/rollbacks/20260901040000_orlando_os_operational_cycle.rollback.sql`
- `package.json`

## Change log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-09-01 | 1.0 | Story derived directly from the Owner-supplied end-to-end operational Goal and current implementation audit. | GPT-5 Codex |
| 2026-09-02 | 1.1 | Local implementation, complete quality gate, disposable Orlando migration validation and rollback evidence recorded. | GPT-5 Codex |
