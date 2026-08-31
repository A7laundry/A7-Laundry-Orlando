# A7 Orlando OS — W0 + W1A Controlled Production Pilot

**Scope:** W0 + W1A only
**Access:** Owner only
**Database target:** `A7xbusinessOS` (`wiwawtpaxnrueugppasi`)
**Mutation status:** GO acknowledged; deployed and smoke-tested on 2026-08-30

## Release boundary

This pilot adds only the private `/sistema` shell, Owner login, Atendimento, Novo atendimento, governed
catalog and one atomic/idempotent manual-sale operation. It records a sale agreed outside the system and
reuses the existing Orlando customer, lead, order, attribution-snapshot and event contracts.

It does not add W1B, W1C, WhatsApp integration, AI, routes or automation. It does not change Stripe,
Google Ads, `/order`, payment behavior or campaign goals.

## Production configuration

Create only after GO:

| Variable | Target | Rule |
|---|---|---|
| `A7_SYSTEM_ACCESS_MODE=owner_only` | Production | Fail closed; Operator sessions are rejected |
| `A7_SYSTEM_SESSION_SECRET` | Production secret | Random value with at least 32 characters |
| `A7_SYSTEM_USERS_JSON` | Production secret | Exactly one Owner record with PBKDF2 salt/hash; no raw password |

The runtime reuses the existing server-only `WHATSAPP_SUPABASE_URL` and
`WHATSAPP_SUPABASE_SERVICE_ROLE_KEY`. No Supabase value is copied to browser code or logs.

## Migration gate

Only `20260830010000_orlando_os_w1a_manual_orders.sql` is pending. Production already contains its full
dependency chain through `20260829100000_orlando_lead_idempotency_concurrency.sql`.

The W1A migration is additive: it creates one sequence, three tables and one new RPC. It does not drop,
truncate, rename or rewrite existing rows. The RPC writes existing customer/lead/order tables only after an
authenticated Owner submits a valid manual sale.

Before apply:

```bash
supabase migration list
supabase db push --dry-run
```

Expected: the only pending remote migration is `20260830010000`.

## Deploy sequence after GO

1. Record current Production deployment ID and health evidence.
2. Apply only migration `20260830010000` through the linked Production project.
3. Re-run the migration ledger and read-only schema checks.
4. Add the three `/sistema` variables above to Vercel Production.
5. Redeploy the same reviewed commit/worktree.
6. Confirm `/`, `/order`, WhatsApp CTA, operational preflight and payment endpoints retain their prior
   non-mutating health behavior.
7. Confirm unauthenticated `/sistema` data APIs return `401` and `/sistema` is `noindex`/`no-store`.
8. Sign in as the single Owner.
9. Create at most one clearly named QA order only if runtime verification cannot be completed without a
   write; do not invoice, charge or deliver it.
10. Retry the same signed submission and confirm the same `A7-ORL-XXXX` with no duplicate aggregate.

## Rollback

### Application rollback — primary

1. Promote/redeploy the recorded prior Vercel Production deployment.
2. Confirm public `/`, `/order`, Stripe and WhatsApp health match the pre-release evidence.
3. Remove or disable only `A7_SYSTEM_ACCESS_MODE`, `A7_SYSTEM_SESSION_SECRET` and
   `A7_SYSTEM_USERS_JSON` after the prior deployment is active.
4. Leave the additive W1A schema inert. This preserves any audit evidence and avoids data loss.

### Schema rollback — exceptional and separately approved

Use `supabase/rollbacks/20260830010000_orlando_os_w1a_manual_orders.rollback.sql`. Its guard refuses to
drop W1A objects if any item, manual request or operator-audit row exists. Any QA cleanup must target the
documented QA aggregate and receive separate approval; real operational records must never be deleted to
make rollback pass.

## Post-deploy report

Report Production URL, prior/current deployment IDs, migration ledger, Owner login, unauthorized access,
one-order/idempotency result, PII/secrets scan, public-flow compatibility, rollback readiness and whether QA
data was created.
