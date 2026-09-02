# A7 Orlando OS — Operational Recovery Forensic Discovery

**Date:** 2026-09-02
**Packet:** 0 — forensic discovery and state-transition authority
**Status:** `PASS WITH IDENTIFIED GAPS`
**Story:** `docs/stories/a7-038-orlando-os-operational-cycle.md`
**Scope:** local source, migrations, RPCs, services, APIs and UI contracts; no remote mutation

## Decision

The Orlando OS already has the intended four independent axes. This recovery wave must extend their existing authorities; it must not create a second lifecycle, custody model, production model, invoice model or payment engine.

| Axis | Canonical persisted authority | Current values |
|---|---|---|
| Lifecycle | `a7_orlando_orders.order_status`, mutated by `a7_orlando_record_transition(...)` | `accepted`, `pickup_scheduled`, `picked_up`, `weighed`, `invoice_created`, `ready_for_delivery`, `delivered`, `cancelled` |
| Custody | `a7_orlando_orders.custody_state`, mutated by `a7_orlando_w1b_transition(...)` through `a7_orlando_operational_cycle_transition(...)` | `with_customer`, `awaiting_pickup`, `with_driver_pickup`, `at_laundry`, `with_driver_delivery`, `bell_desk`, `delivered` |
| Production | `a7_orlando_orders.production_state`, mutated by the same guarded W1B authority and W1C-A weight authority | `awaiting_intake`, `awaiting_weight`, `awaiting_processing`, `processing`, `ready` |
| Finance | `a7_orlando_orders.payment_status` plus versioned invoices and canonical payment records | `pending`, `invoice_created`, `paid`, `failed`, `void`, `partially_refunded`, `refunded` |

Historical nulls are intentionally preserved. Presentation code maps them to a safe blocker rather than inventing state.

## Canonical state-transition matrix

| Current State | Allowed Action | Server Mutation | Side Effect | Audit Event |
|---|---|---|---|---|
| Lifecycle `accepted`; custody `with_customer`/`awaiting_pickup` | Schedule pickup | `a7_orlando_operational_cycle_transition` → `a7_orlando_w1b_transition` → `a7_orlando_record_transition('pickup_scheduled')` | Lifecycle becomes `pickup_scheduled`; custody becomes `awaiting_pickup`; window remains authoritative | `a7_orlando_order_events.pickup_scheduled`, `a7_orlando_operational_events.schedule_pickup`, operator audit |
| Pickup scheduled, active pickup driver assigned, custody `awaiting_pickup` | Confirm pickup | same operational-cycle RPC → lifecycle `pickup_completed` | Lifecycle becomes `picked_up`; custody becomes `with_driver_pickup`; production remains `awaiting_intake`; `picked_up_at` set | lifecycle event, operational event `confirm_pickup`, operator audit |
| Lifecycle `picked_up`; custody `with_driver_pickup` | Receive at laundry | operational-cycle RPC action `receive_at_laundry` | Custody becomes `at_laundry`; production becomes `awaiting_weight` (or trigger advances fixed-price/non-weight work to `awaiting_processing`) | operational event plus operator audit |
| Custody `at_laundry`; per-pound item pending | Record final weight | `a7_orlando_w1c_a_record_item_weight(...)` | Item weight/subtotal/version updated; when complete, lifecycle becomes `weighed` and production `awaiting_processing`; governed minimum remains invoice concern | `a7_orlando_item_weight_events`, lifecycle `order_weighed`, operator audit |
| Custody `at_laundry`; production `awaiting_processing` | Start production | operational-cycle RPC action `start_processing` | Production only becomes `processing` | operational event plus operator audit |
| Custody `at_laundry`; production `processing` | Mark ready | operational-cycle RPC action `mark_ready` | Production becomes `ready`; if already paid/invoiced, lifecycle may become `ready_for_delivery` | operational event, optional lifecycle `order_ready_for_delivery`, operator audit |
| Weight/pricing ready and production `ready`; finance not immutable | Issue/version invoice | `a7_orlando_w1c_b1_review_invoice(...)` | Immutable invoice snapshot and lines inserted; previous issued invoice superseded; order/current invoice linked; finance becomes `invoice_created` | `a7_orlando_invoice_events.invoice_issued`, lifecycle `invoice_created`, operator audit |
| Invoice issued; unpaid | Generate/retrieve Stripe link | existing `/api/create-payment-link` with the operational store and Stripe idempotency | Creates a single-use Stripe Payment Link bound to real `order_id`/`lead_id`; no payment status mutation | Stripe object metadata; payment audit occurs only after webhook |
| Stripe Checkout confirms paid | Reconcile Stripe payment | `/api/stripe-webhook` → `recordPayment(...)` | Canonical payment record; finance becomes `paid`; purchase/outbox created without advancing custody or production | Stripe-event ledger, `purchase`, GA4 outbox |
| Invoice issued; unpaid; Owner/Manager | Register offline/manual reconciliation | `a7_orlando_record_manual_payment(...)` | Finance only becomes `paid`; custody/production/lifecycle unchanged | operational event `manual_payment_recorded`, operator audit |
| Production `ready`; finance `paid`; custody `at_laundry`; active delivery driver assigned | Start delivery | operational-cycle RPC action `start_delivery` | Lifecycle becomes/remains `ready_for_delivery`; custody becomes `with_driver_delivery` | lifecycle event when needed, operational event, operator audit |
| Custody `with_driver_delivery` | Record hotel handoff or direct completion | existing actions `leave_bell_desk` / `complete_delivery` | Bell Desk path sets custody `bell_desk`; direct completion sets lifecycle/custody delivered | operational event; final lifecycle `order_delivered`; operator audit |
| Custody `bell_desk` | Final delivery confirmation | operational-cycle RPC action `complete_delivery` | Lifecycle becomes `delivered`; custody becomes `delivered`; `delivered_at` set | lifecycle `order_delivered`, operational event, operator audit |
| Any non-terminal lifecycle state | Cancel with reason | canonical `a7_orlando_record_transition('order_cancelled')` | Lifecycle becomes `cancelled`; reason/timestamp set; other-axis history is retained | lifecycle `order_cancelled` |
| Paid payment | Partial/full refund | Stripe webhook → `recordRefund(...)` | Finance becomes `partially_refunded`/`refunded`; original purchase retained | Stripe-event ledger and `refund` event/outbox |

## Dependent entities and authorization

- Driver authority: `a7_orlando_drivers`, append-only `a7_orlando_driver_assignments` and `a7_orlando_driver_events`.
- Weight authority: `a7_orlando_order_items` plus `a7_orlando_item_weight_events` with optimistic `weight_version`.
- Invoice authority: `a7_orlando_invoices`, `a7_orlando_invoice_lines`, `a7_orlando_invoice_events`; paid invoices fail closed.
- Stripe authority: existing Payment Link endpoint, webhook, `a7_orlando_payments`, Stripe-event ledger and analytics outbox.
- Operational history: lifecycle events and operational events are separate append-only histories; actor-facing audit is `a7_orlando_operator_audit`.
- Browser requests are same-origin/authenticated; RPC execute permissions are service-role only. Owner/Manager can assign drivers and record payment. Operator is currently limited to `mark_ready` by the service contract.

## Blocker ledger found by Packet 0

| Finding | Evidence | Required correction |
|---|---|---|
| Manual payment evidence is incomplete | Current RPC stores method/amount/time/note but forces `tip_amount=0` and omits explicit invoice, source and reference from its durable record/event | Extend the same manual-reconciliation authority additively; persist service amount, effective tip, total, invoice, source and reference; never create a second payment engine |
| Stripe charge amount currently equals service amount only | Payment Link reads `order.service_amount`; webhook validates total against the same field | Reuse the canonical path and add tip only through an invoice/payment contract that preserves `service revenue != tip`; prove test mode before any remote action |
| Delivery handoff is incomplete | W1B has only `bell_desk` or direct completion; no persisted Front Desk/Concierge/Guest/Other or handoff note | Extend the existing delivery transition/event with a governed handoff point and optional note |
| Production terminal display can remain `ready` | Delivery closes lifecycle/custody, while persisted production remains `ready`; active queues exclude delivered but raw detail still says ready | Preserve history but derive a closed presentation state and prove delivered orders never remain in an active Ready queue |
| Express counters mix distinct meanings | `express_attention` currently counts `attention`, `risk` and `late` together | Split Attention/Risk from Late and make every card reuse the exact queue predicate it counts |
| Waiting leads are not addressable | Safe Home lead rows omit a stable opaque reference and only open the generic Attendance view | Reuse the existing lead/order creation authority with a server-issued opaque reference so the exact lead opens without PII/UUID in URLs |
| Existing-customer detail is read-only | New-order suggestions work, but customer profile has no `NOVO PEDIDO PARA ESTE CLIENTE` action | Add a prefilled action that reuses the known-customer order path |
| Phone feedback is late and too restrictive | Customer submission validates server-side; current helper requires at least ten digits and has no complete inline contract | Validate/normalize internationally in service and UI, accepting plausible international lengths without guessing a country code |
| SPA history is incomplete | UI view switching hides/shows panels but does not give order/customer views durable history entries | Add minimal canonical routing/history; retain dirty-form warning and avoid rebuilding the SPA |
| Original detailed EV/A7 audit artifact is not present in repository or supplied attachments | Only the recovery goal names EV-01…EV-09 and A7-01…A7-28; no case definitions were found | Do not invent case content. Final audit can mark the named blockers and require the original case ledger before claiming all EV cases revalidated |

## Stripe mapping conclusion

The canonical live design is already Payment Link → Checkout Session → signed webhook → operational payment store → purchase/refund outbox. The recovery wave must call and enrich that path; it must not fabricate URLs, write a browser-owned paid flag or add an alternate Stripe reconciliation table.

## Migration decision

The committed local migration `20260901040000_orlando_os_operational_cycle.sql` is additive and replayed successfully against the isolated Orlando chain. Closing the gaps above requires a new additive follow-on migration because it must preserve the already-reviewed objects and history. Its rollback may only drop new objects when no non-QA evidence uses them; application rollback remains the primary rollback.

## Gate 0 verdict

**PASS WITH IDENTIFIED GAPS.** Canonical mutations have been identified for every existing operational stage, so implementation may proceed packet-by-packet. This is not a release verdict. The system remains **NOT READY** until the named gaps, Staging E2E, independent review and final evidence gate pass.
