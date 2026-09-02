# Story A7-038 — A7 Orlando OS Operational Cycle

**Status:** In Progress — local recovery, isolated E2E and independent review complete; isolated Staging and final EV audit remain required

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
- Service amount must be positive USD and must match the current payable invoice amount unless an existing governed exception explicitly permits otherwise.
- Actual tip is an explicit operator-entered payment fact, stored separately from service revenue; it defaults to exactly `0.00` and is never inferred from overpayment.
- Stripe and Zelle require an external reference. The server fixes the evidence source as `operator_entry`; the browser cannot choose or forge it.
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
- [x] Publish the canonical Packet 0 state-transition matrix and blocker ledger without inventing missing EV case definitions.
- [x] Freeze state/action/payment/driver/SLA contracts in focused tests.
- [x] Add the minimal additive schema and guarded rollback for drivers, assignments and manual payments.
- [x] Implement CLI/service operations and prove them before API/UI.
- [x] Add private role-authorized APIs.
- [x] Replace the generic action presentation and add Express, driver and payment controls.
- [x] Apply the bounded trust fixes and dirty-form/single-view contracts.
- [x] Run all local quality gates, build the isolated artifact and document rollback evidence.
- [x] Complete payment/tip/reference/source evidence through the existing payment authorities.
- [x] Complete delivery handoff/closure evidence through the existing operational authority.
- [x] Separate Express attention/risk/late counters and exact queues.
- [x] Complete actionable lead, customer reuse, phone feedback and minimal routing gaps.
- [x] Permit invoice issuance immediately after governed weight capture without coupling Finance to Production.
- [x] Complete a browser-driven isolated E2E through payment, processing, Bell Desk handoff and delivery; remove every synthetic fixture afterward.
- [x] Execute independent review, repair every blocking finding and obtain independent GO for isolated Staging only.
- [x] Add a fail-closed Staging preflight and publish the isolated replay/E2E/cleanup runbook plus final-audit ledger.
- [ ] Freeze an identifiable artifact and execute the complete authenticated E2E in a dedicated Orlando Staging environment.
- [ ] Re-run the final audit; obtain the original EV-01…EV-09 definitions before claiming those cases passed.

## Rollback

Application rollback restores the immutable deployment recorded before cutover. Additive tables, columns, functions and events remain inert. SQL rollback is exceptional and fails closed whenever it would delete driver, assignment, payment, Stripe or other audit evidence. The `20260902015000` hardening is application-backward-compatible and its SQL rollback is deliberately blocked; historical evidence is never deleted merely to simplify rollback.

## Validation evidence

- Focused operational/customer/order/routing tests: `71/71 PASS`.
- Canonical Payment Link/Stripe/attribution tests: `44/44 PASS`, including governed service/tip composition and partial-to-full refund boundaries.
- Repository quality gate: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — all `PASS` on 2026-09-02.
- System pretest suite: `136/136 PASS`; the remaining repository, MOS and focused suites also completed without failures.
- The Orlando migration chain from `20260827010000` through `20260902013000` applied successfully to a disposable local Supabase stack on isolated ports.
- A transactional recovery probe completed the canonical payment, delivery and final-state path and returned `payment=paid`, `order=delivered`, `custody=delivered`, `production=ready`; the enclosing transaction was rolled back and left no residue.
- The isolated Supabase Payment Link probe proved `service=60`, `tip=9`, `total=69`, immutable invoice value and correct refund axes: refunding only the service remains `partially_refunded`; refunding the remaining tip becomes `refunded`. The enclosing transaction rolled back with no residue.
- Repository gates passed after registering the new private routes: `lint`, `typecheck`, the complete `npm test`, focused operational suite `83/83`, and repository build.
- Read-only Vercel inspection found no isolated Orlando Staging target for this recovery branch: existing Preview secrets are scoped to an older Meta branch and no separate operational Staging database was identified. No Preview was created and no Production resource was touched. Staging E2E therefore remains a release blocker rather than being simulated against Production data.
- The canonical Payment Link migration replayed on the isolated Orlando database. Its transaction probe returned `service=60`, `tip=9`, `total=69`, invoice immutability `PASS`, recovered the same reservation after a synthetic Stripe failure and rolled back with no residue.
- The additive `20260902014000` authority was exercised only on the disposable local Orlando database. It permits invoice review in `awaiting_processing`, `processing` and `ready`, keeps QA read-only, accepts only Owner/Manager, retains optimistic version and idempotency controls, and has an explicit function-only rollback.
- Browser-driven isolated E2E for `MCO 1003` proved: numeric lookup; Express promise; pickup schedule and driver custody; receipt at laundry; 11.9 lb weight; `$47.01 + $12.99 minimum = $60.00`; invoice before production; local non-external payment `$60.00 service + $9.00 tip = $69.00`; paid+processing; ready; delivery driver; Bell Desk handoff; final delivery; and Home reconciliation with `0` active ready orders after delivery.
- The E2E used no Stripe charge or other external financial mutation. `MCO 1002`, `MCO 1003`, both synthetic contacts/leads, their child evidence, the QA driver and audit rows were removed from the isolated database; seven independent residue checks returned `0`.
- Post-change repository gates on 2026-09-02: `lint PASS`, `typecheck PASS`, `npm test PASS`, `build PASS`, focused W1C-B1 `10/10 PASS`. SQL lint reported only the same three pre-existing unused-variable warnings and no A7-038 regression.
- `supabase db lint --local --level warning` returned no new A7-038 warning; three pre-existing unused-variable warnings remain in W1B/W1C-A functions.
- Transactional driver RPC probe returned one active driver and was rolled back with no residue; the disposable stack remains isolated on loopback only.
- Independent review initially identified six idempotency/evidence defects. Lifecycle scheduling, driver writes/assignments, manual-payment actor/note evidence, Stripe event conflicts, international-phone bounds and destructive rollback behavior were repaired and regression-tested.
- The hardened SQL probe exercised exact/conflicting pickup retries, immutable driver-result snapshots after later deactivation and assignment retries inside `BEGIN … ROLLBACK`; it passed against the disposable local Orlando database with no residue.
- Final independent re-review returned `GO` for isolated Staging only: focused review suite `30/30 PASS` and `git diff --check PASS`. This is not a Production authorization.
- Final local repository gate after the review repairs: focused suite `71/71 PASS`; `lint`, `typecheck`, complete `npm test` and `build` all `PASS`. SQL lint reported only the same three pre-existing unused-variable warnings.
- The `staging-e2e` preflight profile rejects Orlando Production `wiwawtpaxnrueugppasi`, the foreign project `zquefoznqwkfbnnfalmt`, mixed Supabase namespaces, Production Vercel hosts and Stripe live keys without printing secrets. Its focused suite passed `11/11`.
- The first independent review of the remote Staging gate correctly returned `NO-GO`: the deployed runtime still selected `preview-steady`, the Stripe webhook mode was not proven from the remote endpoint, GA4 could still collect into the Production property and the local Supabase link was only advisory.
- Those four findings are now repaired locally. The A7-038 Preview runtime selects `staging-e2e`; Stripe verifies the exact endpoint ID as enabled, `livemode=false` and bound exclusively to the current deployment's `VERCEL_URL`; GA4 is required to use validation-only `/debug/mp/collect` with DebugView disabled; and the guarded Supabase wrapper rejects missing, mismatched, Production and foreign linked refs immediately before and after every allowed CLI command.
- Focused Staging guard/runtime suite after the repairs: `17/17 PASS`, including an adversarial conflicting-base-URL case. The live local guard returned the expected fail-closed `NO-GO` because `supabase/.temp/project-ref` still points to Orlando Production and no dedicated Staging ref is configured; no migration ran.
- Full repository gates after the four Staging repairs on 2026-09-02: `lint PASS`, `typecheck PASS`, complete `npm test PASS`, `build PASS`, and `git diff --check PASS`.
- A fresh independent final review found no remaining webhook-host bypass and returned `GO` only for provisioning and E2E in isolated Staging. It explicitly did not authorize Production.
- On 2026-09-02 the Owner explicitly superseded the earlier Staging-first instruction and authorized a controlled direct Production cutover for Owner-led online testing. This exception does not convert the original final-audit Staging gate into PASS and does not justify a `READY FOR NEW EMPLOYEE` verdict by itself.
- Production database cutover used a detached copy of exact commit `c585fc0c72ea8a7ea34485c72f9db1d05b825a26`. The selective dry-run excluded W2 WhatsApp and initially exposed the required known-customer dependency. Team access `20260901030000/30001` committed successfully; `20260901040000` then failed before applying because W3-A was absent. After classifying the failure, the required customer-reuse migration `20260830070000` was included and the remaining A7-038 chain through `20260902015000` applied successfully. Remote migration history confirms every selected version; W2 `20260830060000` remains pending and inactive.
- Vercel Production deployment `dpl_6N1nBgQhMASfNTGLT91vxeY4rNMG` is `READY` and owns `a7laundry.com`. Application rollback target is the immediately preceding Ready deployment `dpl_4YAyCFCfyGi5sPPpvLXfoeN6FUzQ`.
- Live unauthenticated smoke: `/sistema` returned `200`; private health/session/Home/driver/payment endpoints returned `401`; CSP, HSTS, frame denial, no-store and `X-Robots-Tag: noindex` are present. Live HTML, JS and CSS SHA-256 hashes exactly match the local Production bundle. The prior Owner browser session returned to the login screen after deployment, so authenticated mutation/reload E2E remains pending Owner login and was not fabricated.
- The isolated Staging runbook and final-audit ledger are prepared. They keep the verdict `NOT READY` until remote E2E, zero-residue proof and the missing original EV/A7 definitions are supplied.
- The repository-wide blank-database chain still has a pre-existing unrelated blocker at `20260325_payments_utm.sql` because that legacy migration assumes a `payments` table. This does not affect the isolated Orlando chain, but remains repository migration debt.
- No Supabase remote, Vercel, Stripe, WhatsApp, Google Ads, commit, push or deploy mutation was performed.

## File list

- `docs/stories/a7-038-orlando-os-operational-cycle.md`
- `docs/audits/2026-09-02-orlando-os-operational-recovery-forensic.md`
- `docs/audits/2026-09-02-orlando-os-operational-recovery-final-audit-ledger.md`
- `docs/runbooks/a7-orlando-os-a7-038-staging-e2e.md`
- `lib/system-operational-cycle-service.js`
- `lib/system-operations-service.js`
- `lib/system-order-service.js`
- `lib/system-home-service.js`
- `lib/system-invoice-service.js`
- `lib/system-lead-reference.js`
- `lib/system-lead-service.js`
- `lib/system-payment-link-service.js`
- `lib/operational-store.js`
- `api/system/drivers.js`
- `api/system/manual-payment.js`
- `api/system/customers.js`
- `api/system/orders.js`
- `api/system/leads.js`
- `api/system/payment-link.js`
- `api/system/order-invoices.js`
- `api/create-payment-link.js`
- `api/stripe-webhook.js`
- `scripts/a7-system-operational-cycle.mjs`
- `scripts/test-system-operational-cycle.mjs`
- `scripts/test-system-home.mjs`
- `scripts/test-system-w0-w1a.mjs`
- `scripts/test-system-w1b.mjs`
- `scripts/test-system-w1c-b1.mjs`
- `scripts/test-system-w3-a.mjs`
- `sistema.html`
- `sistema.js`
- `sistema.css`
- `supabase/migrations/20260901040000_orlando_os_operational_cycle.sql`
- `supabase/migrations/20260902009000_orlando_lifecycle_authority_repair.sql`
- `supabase/migrations/20260902010000_orlando_os_payment_evidence.sql`
- `supabase/migrations/20260902011000_orlando_os_delivery_handoff.sql`
- `supabase/migrations/20260902012000_orlando_actionable_public_leads.sql`
- `supabase/migrations/20260902013000_orlando_canonical_payment_link.sql`
- `supabase/migrations/20260902014000_orlando_invoice_after_weight.sql`
- `supabase/migrations/20260902015000_orlando_idempotency_hardening.sql`
- `supabase/rollbacks/20260901040000_orlando_os_operational_cycle.rollback.sql`
- `supabase/rollbacks/20260902009000_orlando_lifecycle_authority_repair.rollback.sql`
- `supabase/rollbacks/20260902010000_orlando_os_payment_evidence.rollback.sql`
- `supabase/rollbacks/20260902011000_orlando_os_delivery_handoff.rollback.sql`
- `supabase/rollbacks/20260902012000_orlando_actionable_public_leads.rollback.sql`
- `supabase/rollbacks/20260902013000_orlando_canonical_payment_link.rollback.sql`
- `supabase/rollbacks/20260902014000_orlando_invoice_after_weight.rollback.sql`
- `supabase/rollbacks/20260902015000_orlando_idempotency_hardening.rollback.sql`
- `scripts/test-system-idempotency-hardening.sql`
- `scripts/test-payment-link.mjs`
- `scripts/a7-staging-supabase.mjs`
- `scripts/test-a7-staging-supabase.mjs`
- `scripts/preflight-operational-attribution.mjs`
- `scripts/test-operational-release-preflight.mjs`
- `lib/operational-release-preflight.js`
- `api/operations/preflight.js`
- `vercel.json`
- `governance/content-registry.mjs`
- `mos-app/generated/content-catalog.json`
- `package.json`

## Change log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-09-01 | 1.0 | Story derived directly from the Owner-supplied end-to-end operational Goal and current implementation audit. | GPT-5 Codex |
| 2026-09-02 | 1.1 | Local implementation, complete quality gate, disposable Orlando migration validation and rollback evidence recorded. | GPT-5 Codex |
| 2026-09-02 | 1.2 | Packet 0 forensic matrix published; status reopened because payment, delivery, counter and supporting UX gaps remain. | GPT-5 Codex |
| 2026-09-02 | 1.3 | Canonical Payment Link, separate tip accounting, refund boundary, private nested routing and local replay/quality evidence completed; Staging E2E remains pending. | GPT-5 Codex |
| 2026-09-02 | 1.4 | Invoice-after-weight authority, complete isolated browser E2E, post-delivery Home reconciliation and zero-residue cleanup recorded. | GPT-5 Codex |
| 2026-09-02 | 1.5 | Independent-review idempotency and evidence findings repaired; local SQL/repository gates passed and independent GO obtained for isolated Staging only. | GPT-5 Codex |
| 2026-09-02 | 1.6 | Added fail-closed Staging isolation checks, exact E2E/cleanup runbook and non-invented final-audit ledger. | GPT-5 Codex |
| 2026-09-02 | 1.7 | Repaired the independent-review Staging blockers with deployed runtime selection, exact current-deployment Stripe test binding, GA4 validation-only enforcement and a fail-closed linked-target Supabase wrapper; all local gates and the final independent review pass for isolated Staging only. | GPT-5 Codex |
| 2026-09-02 | 1.8 | Recorded the Owner-authorized direct Production exception, selective additive migration result, immutable deployment/rollback IDs and live public security/hash smoke; authenticated Owner E2E remains pending. | GPT-5 Codex |
