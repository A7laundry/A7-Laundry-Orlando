# A7 Orlando OS — W0 + W1A Release Audit

> **Evidence correction — 2026-08-30:** all statements in this audit treating
> `zquefoznqwkfbnnfalmt` as an isolated Orlando staging database are invalid. The project is a
> pre-existing A7X OS system. The accidental Orlando objects and dedicated Preview access were removed;
> the legacy system's critical row-count baseline remained unchanged. See
> `2026-08-30-zquefo-orlando-cross-project-cleanup.md`.

**Date:** 2026-08-30
**Scope:** W0 + W1A only
**Environment:** local; former Preview database target invalidated
**Status:** `LOCAL EVIDENCE RETAINED / STAGING EVIDENCE INVALID / PREVIEW RETIRED`

## Executive state

The first useful operational slice is implemented without adding WhatsApp automation, W1B, W1C or a
parallel lifecycle. The operator workflow is:

```text
/sistema → login → Atendimento → Novo atendimento
→ register an externally agreed sale → governed catalog
→ atomic customer + lead + order + items → A7-ORL-XXXX → next action
```

Production has not been deployed or changed by this release.

## Architecture implemented

| Layer | Implementation | Boundary |
|---|---|---|
| Operator shell | `sistema.html`, `sistema.css`, `sistema.js` | No acquisition tracking, browser storage or technical IDs |
| Authentication | signed, expiry-bound `__Host-` cookies; PBKDF2 users; owner/operator roles | Server-authorized APIs only |
| Submission idempotency | signed HttpOnly submission cookie | UUID never enters browser JavaScript or form data |
| Catalog | `config/orlando-service-catalog.json` + server resolver | Operator-supplied price/minimum ignored |
| W1A service | `lib/system-order-service.js` | One validation and result contract for CLI/API |
| Durable write | `a7_orlando_create_manual_order` RPC | One database transaction reusing existing lifecycle RPCs |
| Operational storage | existing Supabase store extended for W1A | `sb_secret_` sent through `apikey` only |
| Observability | authenticated sanitized health + existing lifecycle/outbox | No PII or secrets in health/log payloads |

## Requirement evidence

| Requirement | State | Evidence |
|---|---|---|
| Private login and secure session | PASS locally | authentication/tamper/expiry/cookie tests |
| Owner and Operator roles | PASS locally | environment user contract and server role allowlist |
| Server-side authorization | PASS locally | private API test returns `401`; every system data API calls `requireSession` |
| `noindex` and no public cache | PASS in build | HTML meta, Vercel headers and registry system exclusion |
| Sanitized health | PASS locally | authenticated health checks auth plus real database table availability |
| CLI/service before UI | PASS locally | `system:manual-order` and shared service module |
| Synthetic fixture | PASS locally | `tests/fixtures/orlando-os-w1a-order.json` |
| Governed pricing | PASS locally | Normal $3.25/lb, Express $3.95/lb, $50 minimum; injection test ignored |
| Atomic customer/lead/order/items | PASS locally; schema installed | in-memory rollback test plus single durable RPC transaction |
| Available attribution frozen | PASS by contract | W1A resolves A7 Ref in the existing attribution tables and reuses accept-order snapshot logic |
| No invented analytics identity | PASS locally | W1A server forces analytics context to null; operator may supply only validated A7 Ref |
| Human order number | PASS locally | exact `A7-ORL-XXXX` test and durable sequence |
| Retry has no duplicates | PASS locally | identical retry returns same order; aggregate counts remain one |
| Safe lookup | PASS locally | authenticated lookup omits UUID/lead/order/attribution IDs |
| Rollback | PASS documented | `docs/runbooks/a7-orlando-os-w0-w1a-preview.md` |
| 390 px and desktop Preview | PENDING | requires configured Vercel Preview |
| Live Preview workflow | PENDING | requires configured Vercel Preview |

## Database evidence

Read-only checks on `A7x Os Staging` (`zquefoznqwkfbnnfalmt`) returned:

- `a7_orlando_orders`: present;
- `a7_orlando_order_items`: present;
- `a7_orlando_manual_order_requests`: present;
- `a7_orlando_create_manual_order`: exactly one function;
- `a7_orlando_accept_order`: exactly one function.

The migration-history ledger still requires confirmation before Preview deployment because the schema was
applied through the SQL editor. This is not treated as complete merely because the tables exist.

## Automated gates

| Gate | Current result |
|---|---|
| W0/W1A tests | PASS — 8/8 |
| Operational/WhatsApp compatibility tests | PASS — 28/28 |
| Full repository test suite | PASS before final `sb_secret_` hardening; final full rerun required before release |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

## Known limitations

- One authenticated browser session supports one active Novo atendimento draft at a time. Opening a second
  draft rotates the HttpOnly idempotency cookie for that session.
- W1A does not implement Hoje, custody, weighing, invoice, payment, routes, WhatsApp inbox or AI.
- A manual WhatsApp sale without a deterministic A7 Ref remains explicitly unattributed and without invented
  GA identity, as required.
- Special items without a governed price are marked for manual review; the system never invents a value.

## Remaining release gates

1. Confirm Supabase migration history.
2. Create/use a dedicated Staging secret and configure four branch-scoped Preview variables.
3. Deploy the current worktree to Vercel Preview only.
4. Execute owner/operator, unauthorized, idempotency, safe lookup, headers and PII checks.
5. Validate the UI at 390 px and desktop.
6. Update this audit and Stories A7-016/A7-017 with runtime evidence and the Preview URL.
