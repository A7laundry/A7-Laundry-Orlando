# A7 Orlando OS — W3-D Rotas Lite Staging E2E

**Status:** SUPERSEDED — Owner replaced this gate with the controlled Production pilot on 2026-09-02

The historical Staging procedure below is retained for audit only. It must not be executed and it does not authorize
use of `zquefoznqwkfbnnfalmt`. The active release procedure is
`docs/runbooks/A7-ORLANDO-W3D-ROUTES-PRODUCTION-PILOT-2026-09-02.md`.

## Scope

This runbook proves the exact W3-D candidate before the `Rotas` menu can be enabled. It does not authorize a
Production migration, Production deploy, financial action, message, map, GPS or route optimization.

## Immutable boundaries

- Orlando Production Supabase: `wiwawtpaxnrueugppasi` — forbidden for this rehearsal.
- Foreign project: `zquefoznqwkfbnnfalmt` — forbidden; it belongs to another system.
- Production application currently serving `a7laundry.com`: `dpl_sfsdCQA69WxZkJaRJfEv2nospB74` — read-only
  baseline for this packet.
- Candidate identity is the clean Git commit returned by `git rev-parse HEAD`; the same commit must back every
  staging observation.
- `Rotas` remains disabled in normal navigation during the rehearsal. Authenticated staging QA enters directly at
  `/sistema/routes`.

## Preconditions

1. A dedicated Supabase project exists only for A7 Orlando Staging.
2. `A7_STAGING_SUPABASE_PROJECT_REF` is the exact dedicated ref and is neither forbidden ref above.
3. `supabase/.temp/project-ref` matches that exact ref.
4. The Vercel Preview is bound only to that same Staging project and has no Production database credential.
5. The worktree is clean and the candidate commit is recorded.
6. `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass on that commit.
7. Only migrations `20260902018000` and `20260902018001` are pending for W3-D.

Fail closed if any precondition is unknown.

## Guarded rehearsal

```text
npm run guard:orlando:staging-db
npm run staging:db:push:dry-run
supabase migration list --linked
supabase db lint --linked --level warning
```

After review, apply the two additive migrations only through the guarded Staging command. Never relink this working
copy to Production or the foreign project.

## Synthetic dataset

Use only a dedicated Staging dataset containing:

- driver `QA DRIVER`;
- pickup orders A and C;
- one paid/ready delivery order B backed only by a synthetic internal Staging fact, never a Stripe action;
- pickup order D for `Could not complete`;
- no real phone, address, hotel room, customer, payment, message or attribution identity.

The normal W3-D eligibility rule intentionally rejects records classified as Production QA. Do not weaken that rule
or falsify a Production record to make the smoke pass. The persistent browser fixture and its complete cleanup must
be designed and reviewed against the dedicated Staging database before this runbook can move to READY.

## Owner E2E

Execute through the authenticated Staging UI and API:

```text
NEW ROUTE
→ SELECT QA DRIVER
→ ADD PICKUP A
→ ADD DELIVERY B
→ ADD PICKUP C
→ ADD PICKUP D
→ REORDER C → A → B → D
→ RELOAD AND VERIFY ORDER
→ START ROUTE
→ COMPLETE PICKUP C
→ VERIFY ORDER C CUSTODY
→ RELOAD
→ COMPLETE PICKUP A
→ ATTEMPT DUPLICATE PICKUP A
→ VERIFY ONE ROUTE EVENT + ONE ORDER EVENT
→ COMPLETE DELIVERY B WITH GOVERNED HANDOFF
→ RECORD EXCEPTION FOR D
→ VERIFY ORDER D DID NOT MOVE
→ COMPLETE ROUTE
→ VERIFY HISTORY
```

Repeat the active-route execution at an exact 390 px viewport. There must be no required horizontal scroll; the next
stop and its one valid action must remain visible and reachable.

## Regression and audit gates

- Direct order pickup and delivery continue to work without a route.
- Bell Desk remains intermediate until explicit final confirmation.
- Route completion does not move an order or financial state.
- Owner and Manager pass; unauthenticated returns 401; Operator returns 403.
- Every critical route action has actor and UTC timestamp.
- No protected identifier, PII, idempotency value or secret appears in URL, browser storage, analytics or logs.
- No Stripe, WhatsApp, GA4 or Google Ads action occurs.

## Cleanup

Do not claim zero residue until the dedicated Staging cleanup is proven against every route, stop, driver assignment,
delivery/custody event and synthetic order dependency. Never delete a Production row or append-only real operational
event. If complete cleanup is not proven, reset only the dedicated Staging project through its approved recovery
procedure.

## Release decision

`GO` requires every W3-D gate, the browser/device E2E, regression checks and zero-residue proof. Only then may a new
candidate enable `Rotas`, repeat the exact Staging checks and be presented for a separately authorized Production
cutover. Any missing evidence is `NO-GO`.
