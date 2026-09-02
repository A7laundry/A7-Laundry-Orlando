# A7 Orlando OS — W3-D Rotas Lite Forensic Discovery

**Date:** 2026-09-02  
**Scope:** Packet W3-D.0 only  
**Production project inspected read-only:** `wiwawtpaxnrueugppasi`

## EXISTING

- The Production migration ledger is current through `20260902017000`. A read-only schema dump confirms the existing
  Orlando order, driver, active driver-assignment and operational-event structures.
- `a7_orlando_drivers` is the canonical driver directory. Only active drivers may receive a new assignment; historical
  assignments survive deactivation. Owner manages drivers and Owner/Manager may read and assign them.
- Pickup and delivery responsibility already use `a7_orlando_driver_assignments`, independently by order leg.
- The order remains the four-axis source of truth. The accepted transition service exposes `schedule_pickup`,
  `confirm_pickup`, `receive_at_laundry`, `start_processing`, `mark_ready`, `start_delivery`, `leave_bell_desk` and
  `complete_delivery` with server authorization and idempotency.
- Bell Desk/Front Desk/Concierge handoff is already implemented by the canonical delivery transition. The Production
  evidence in A7-038 proves Bell Desk as an intermediate custody state followed by explicit final confirmation.
- Same-origin session protection, signed submission identities, service-role-only database functions and the current
  Owner/Manager/Operator RBAC are reusable.
- `/sistema` contains only a deliberately disabled `Rotas · W3` navigation control. There is no hidden or partial route
  application behind it.

## MISSING

- No `routes`, `route_stops` or route audit/event relation exists in the Production schema.
- No route service, RPC, private API, UI view, feature flag or route-focused test exists.
- The system cannot yet create a route, attach eligible order legs, persist a manual sequence, start/complete a route,
  record a stop exception or show route history.
- Route-specific optimistic concurrency and the single-active-route constraint per `order_id + stop_type` do not exist.

## REUSE PLAN

1. Route records reference the existing active `driver_id`; no second driver directory is created.
2. Stops reference only `order_id` and `stop_type`. Customer, hotel, room, address, service, SLA, handoff and other
   operational facts are projected from the canonical order at read time.
3. Route create/add/reorder/start/exception/complete actions use a new route-only application service with server-side
   Owner/Manager authorization, request fingerprints, optimistic versions and append-only route events.
4. A successful pickup stop calls the existing operational transition authority with `confirm_pickup`. A successful
   delivery stop calls the existing `start_delivery`, `leave_bell_desk` or `complete_delivery` authority as appropriate.
   Route code never updates lifecycle, custody, production or finance columns directly.
5. A route stop becomes terminal only after the required canonical order mutation succeeds. A Bell Desk visit may be
   terminal for the physical stop with result `handoff_recorded`, while the order truthfully remains in `bell_desk`
   until the already-existing explicit final confirmation.
6. A failed stop records only a route exception and leaves the order unchanged. Once the containing route is terminal,
   the order leg is eligible for a later route if its canonical order state still requires that action.
7. The existing direct order workflow remains untouched and usable without a route.

## MIGRATION NEED

**YES.** The minimum additive model requires three protected relations (`a7_orlando_routes`,
`a7_orlando_route_stops`, `a7_orlando_route_events`) plus service-role-only RPCs/indexes for atomic route writes,
idempotency, ordering and concurrency. No existing table can safely represent route identity and manual stop order
without mixing concerns or becoming a second order lifecycle.

The migration must be application-backward-compatible and inert after application rollback. It must not migrate old
orders into routes, change historical states or make routes mandatory.

## Gate W3-D.0 verdict

**GO FOR LOCAL W3-D.1 DESIGN AND IMPLEMENTATION.**

- Architecture reuse: PASS.
- Driver source: PASS — current active driver directory; no hard-coded seed list required.
- Route authority: PASS — Owner and Manager/Gestora only; Operator denied server-side.
- Bell Desk dependency: PASS — canonical intermediate handoff and explicit final confirmation are implemented and
  evidenced in A7-038.
- Production release: NOT AUTHORIZED. The menu remains disabled until migrations, desktop/mobile, pickup, delivery,
  idempotency, audit, RBAC, regression and Staging E2E gates all pass.
