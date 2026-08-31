# A7 Orlando OS — W0 + W1A Preview Runbook

> **RETIRED / DO NOT EXECUTE — incident correction, 2026-08-30:** the project
> `zquefoznqwkfbnnfalmt` was incorrectly classified as an Orlando staging database. It is a
> pre-existing A7X OS project and must not be used by Orlando Preview. The two Vercel Preview variables,
> the dedicated Orlando key and all isolated `a7_orlando_*`, `a7_attribution_*` and `a7_wa_*` objects
> created there were removed under the guarded incident rollback. This historical runbook is retained
> only as evidence; a replacement requires a separately approved database target.

**Scope:** Preview only
**Production:** not authorized
**Stories:** A7-016 and A7-017
**Database target:** **INVALIDATED — no Orlando staging database is currently approved**

## Release boundary

This release contains only:

- private `/sistema` login and `owner` / `operator` sessions;
- Atendimento and Novo atendimento;
- registration of a sale already agreed outside the system;
- server-governed catalog and pricing;
- one atomic, idempotent customer + lead + order + item operation;
- safe `A7-ORL-XXXX` result and authenticated lookup.

It does not contain Hoje/custody, weighing, invoice, new payment behavior, WhatsApp inbox/API,
AI, routing or Production deployment.

## Preview configuration

The following variables belong only to the Vercel Preview branch:

| Variable | Type | Rule |
|---|---|---|
| `A7_OPERATIONS_SUPABASE_URL` | Secret | URL for the isolated Staging project |
| `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | Secret | Staging `sb_secret_` key; server only |
| `A7_SYSTEM_SESSION_SECRET` | Secret | Random value of at least 32 characters |
| `A7_SYSTEM_USERS_JSON` | Secret | PBKDF2 salts/hashes; never raw passwords |

Never copy these values to browser code, logs, URLs, documentation or Production as part of this release.

## Database apply and validation

Apply the existing additive Orlando operational migrations followed by:

`supabase/migrations/20260830010000_orlando_os_w1a_manual_orders.sql`

Required read-only verification:

```sql
select
  to_regclass('public.a7_orlando_orders') is not null as orders,
  to_regclass('public.a7_orlando_order_items') is not null as items,
  to_regclass('public.a7_orlando_manual_order_requests') is not null as requests;

select count(*) filter (where proname = 'a7_orlando_create_manual_order') as manual_rpc,
       count(*) filter (where proname = 'a7_orlando_accept_order') as accept_rpc
from pg_proc
where proname in ('a7_orlando_create_manual_order', 'a7_orlando_accept_order');
```

Expected: all booleans `true`; both function counts `1`.

## Pre-deploy gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

All must pass before the Preview deployment.

## Synthetic QA

Use only synthetic data based on:

`tests/fixtures/orlando-os-w1a-order.json`

Validate at desktop and 390 px:

1. unauthenticated `/api/system/orders` returns `401`;
2. login succeeds for `owner` and `operator` actors;
3. `/sistema` and `/api/system/*` return `no-store` and `noindex` headers;
4. Novo atendimento loads price, unit and minimum from the authenticated catalog endpoint;
5. the browser never receives a submission UUID, order UUID, lead UUID or attribution UUID;
6. one submission returns one `A7-ORL-XXXX`;
7. a retry with the same signed HttpOnly submission cookie returns that same number;
8. safe lookup reopens the same order/customer summary;
9. Staging contains one customer, one lead, one order and the expected items for the QA aggregate;
10. no secret or non-synthetic PII appears in browser URLs, console, analytics or deployment logs.

## Rollback

Application rollback is the primary path:

1. remove the Preview alias or redeploy the prior Preview deployment;
2. remove the four W0/W1A Preview variables;
3. revoke/rotate the Staging secret key if exposure is suspected;
4. leave additive tables in place and stop all W1A writes.

Do not drop tables as an incident response. If schema cleanup is later approved, archive synthetic QA rows,
verify there are no real operator records, and perform a separately reviewed migration. Production remains
untouched throughout this runbook.
