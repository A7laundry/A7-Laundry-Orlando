# Story A7-015 — Consolidar Blueprint V0.4 do A7 Orlando OS

**Status:** Done — V0.4 reconciled through W1A.1; later releases gated

**Created:** 2026-08-29

**Updated:** 2026-08-30

**Blueprint:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`

## Story

**As the** A7 Laundry Orlando owner,

**I want** a consolidated, implementable and lean V0.4 blueprint,

**so that** the business can later operate a complete day through one order-centered system without
building a generic CRM, ERP or autonomous platform.

## Authorization boundary

This story authorizes documentation only. W0 through W1A.1 were implemented under their own bounded
stories and Production authorizations. This story does not authorize later-wave code, remote mutation,
WhatsApp onboarding, Stripe changes, financial testing, Production deploy or Google Ads changes.

## Acceptance criteria

- [x] Preserve valid V0.1 principles and identify obsolete decisions.
- [x] Make the order the system center and `Hoje` the home.
- [x] Fix navigation to Hoje, Atendimento, Pedidos, Clientes and Rotas.
- [x] Specify IA as an embedded, human-reviewed copilot.
- [x] Separate automatic lead creation from human order acceptance.
- [x] Specify multiple order items and item-level weight/pricing.
- [x] Specify custody, production, lifecycle and finance as separate coordinated axes.
- [x] Specify deterministic Express SLA without predictive AI.
- [x] Specify line-based invoice, correct Payment Link and current tip constraint.
- [x] Specify minimal customers, reconciliation and simple manual routes.
- [x] Reconcile UX with current APIs, schema, Stripe, WhatsApp and attribution lifecycle.
- [x] Define W0, W1A–W1C and W2–W4 delivery order and definitive day-in-operation test.
- [x] Revise delivery priority so W1A supports manual external-sale registration and atomic order
  creation before WhatsApp/AI automation.
- [x] Record non-goals, risks and wave-specific blocking decisions.
- [x] Make no implementation or external-state change.
- [x] Reconcile the blueprint with W0/W1A.1 already verified in Production.
- [x] Split later waves into small, independently approved releases.
- [x] Pull forward only `Clientes Lite`; preserve full reconciliation/LTV for W3.

## Validation notes

- Current backend supports durable attribution but not order items, custody, production, routes,
  human order numbers or line-based invoice.
- Current financial contract requires `tip_amount=0`; V0.3 preserves this until separately revised.
- WhatsApp Bridge exists technically; real-number Coexistence remains a W2 gate.
- W1A is intentionally usable with normal WhatsApp Business and does not replicate conversations.
- `/sistema` becomes operational truth first; WhatsApp becomes automatic input only in W2.
- Adding `business_id` now is not low-cost and is excluded.

## Implementation gate

No implementation may start under this story. W0/W1A require bounded implementation stories,
acceptance criteria, rollback, test data and explicit authorization.

## Quality validation

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`

## File List

- `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`
- `docs/stories/a7-015-orlando-laundry-operations-system.md`
