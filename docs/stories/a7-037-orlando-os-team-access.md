# Story A7-037 — A7 Orlando OS Team Access and Safe RBAC

**Status:** Ready for Production Authorization — local gates passed

**Created:** 2026-09-01

**Sources:** Owner Goal “Gestão Segura de Usuários e Perfis de Acesso”; Orlando OS blueprint; existing W0 authentication and W1–W3 authorization contracts

## Story

**As the** A7 Laundry Owner,

**I want** to administer a small, persistent and audited team directory inside `/sistema`,

**so that** a Manager can run the business without receiving control over Owners, authentication policy or critical security.

## Scope lock

### In scope

- Persistent users with `owner`, `manager`, `operator` and inactive status.
- Database-backed authentication with the current Vercel Owner retained as a cutover fallback.
- Server-side session revalidation so inactive users and changed roles lose access.
- Owner-only user administration, safe temporary-password reset and forced first-login password change.
- Append-only authentication and administration audit.
- Owner-only `Equipe` UI with profile, role, status, timestamps and history.
- Manager access to operational, customer, hotel, invoice/payment and financial management.
- Andreia's controlled migration from `operator` to `manager` during Production cutover.

### Out of scope

- SSO, Google Workspace, multiple organizations or user-configurable permission matrices.
- Permanent deletion of users or audit history.
- Removing the Vercel fallback before the complete Production smoke passes.
- Changes to Stripe, WhatsApp, Google Ads, attribution or public `/order` behavior.

## Fixed permission matrix

| Capability | Owner | Manager | Operator | Inactive |
|---|---:|---:|---:|---:|
| Sign in and view operational work | Yes | Yes | Yes | No |
| Manage customers, hotels and orders | Yes | Yes | Bounded operational actions | No |
| Manage invoices/payment workflow and view finance | Yes | Yes | No | No |
| Manage users, roles, credentials and security | Yes | No | No | No |
| Create, demote, deactivate or change an Owner | Existing Owner safeguards only | No | No | No |
| Permanently delete users/audit | No | No | No | No |

## Acceptance Criteria

- [x] **AC-01 — Additive persistence.** A service-role-only migration creates persistent users and append-only user events without modifying existing business records.
- [x] **AC-02 — Secure credentials.** Passwords are stored only as salt plus a strong one-way hash; plaintext passwords never enter the database, logs, URLs, analytics or committed files.
- [x] **AC-03 — Hybrid cutover.** Database authentication is preferred while the existing environment Owner remains a functional fallback until separately retired after complete validation.
- [x] **AC-04 — Revocation.** Every database-backed session is revalidated server-side against active status, current role and credential version; inactive or stale sessions fail closed.
- [x] **AC-05 — Owner administration.** Owner can list, create, update, activate/deactivate and reset credentials through private APIs; Manager/Operator receive `403`.
- [x] **AC-06 — Owner protection.** Manager cannot create, change, deactivate, reset or remove an Owner and cannot elevate any user; permanent deletion is unavailable to every role.
- [x] **AC-07 — Manager capability.** Manager receives operational, customer, hotel, invoice/payment and finance access but no user/security administration payload or UI.
- [x] **AC-08 — Operator boundary.** Operator retains only the currently approved bounded operational access and receives `403` for Manager/Owner-only resources.
- [x] **AC-09 — Temporary password.** Owner reset produces a single temporary credential, increments credential version and sets `must_change_password=true` without returning a stored secret later.
- [x] **AC-10 — Forced change.** A temporary-password user can access only session/logout/password-change endpoints until a compliant new password is installed; a fresh normal session is then issued.
- [x] **AC-11 — Audit and timestamps.** Create, edit, role/status change, reset, login success/failure and password change record actor/action/time; `last_login_at`, `created_at` and `updated_at` remain truthful.
- [x] **AC-12 — Historical continuity.** Deactivation never deletes orders, invoices, audit events or the persistent opaque actor identifier.
- [x] **AC-13 — Equipe UI.** Owner-only UI shows full name, phone, email, job title, role, status, last login, created/updated timestamps, reset action and user history with explicit loading/error/empty states.
- [ ] **AC-14 — Andreia migration.** Production cutover creates or updates `andreiabatemarque@gmail.com` as active `manager`, validates her login and proves Owner-only administration remains forbidden.
- [ ] **AC-15 — Quality and cutover.** Focused acceptance tests plus lint, typecheck, full tests and build pass before any Production migration; Production smoke covers Owner/Manager/Operator/inactive and rollback readiness.

## Tasks

- [x] Define centralized roles/capabilities and update server authorization consumers.
- [x] Add migration and guarded rollback documentation.
- [x] Implement database user store, hybrid authentication and async session revalidation.
- [x] Implement Owner-only users API and authenticated password-change API.
- [x] Add Equipe UI and forced-password-change experience.
- [x] Add CLI helper for safe preflight without printing secret values.
- [x] Cover the local acceptance criteria with focused tests, responsive visual QA and full repository gates.
- [ ] Prepare Production migration, Andreia migration, authenticated smoke and fallback removal gate.

## Rollback

- Before fallback retirement, application rollback restores the prior deployment and the legacy Owner remains valid.
- The additive database objects remain inert if the application is rolled back.
- Users and audit records are never destructively removed during rollback.
- Fallback retirement is a separate final action only after all role and login smokes pass.

### Controlled Production sequence

1. Confirm the target project is Orlando Production `wiwawtpaxnrueugppasi` and run `npm run system:users:preflight` with Production environment names loaded.
2. Apply only migrations `20260901030000` and `20260901030001`.
3. Keep the existing Vercel Owner credentials and legacy fallback enabled; set access mode to `team` only for the new deployment.
4. Deploy the isolated application artifact and verify the legacy Owner first.
5. Create a persistent Owner and Andreia as active `manager`; each receives a one-time temporary password and must replace it personally.
6. Smoke Owner, Manager, Operator and inactive behavior. Manager must receive `403` from users/security and Operator must receive `403` from finance/invoice management.
7. If an application gate fails, restore the previous deployment. The additive tables/functions remain inert and no user/audit record is deleted.
8. Retiring the legacy Owner fallback requires a later, separate authorization after both persistent logins and all authorization gates pass.

## Local gate evidence

- Focused system suite: 108/108 passed after the final security and UI hardening; the same suite also runs in `npm test`.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- Desktop and 390px mobile visual QA: passed; the temporary-password value is cleared when leaving Equipe.

## File List

- `api/system/{catalog,customers,finance,health,home,hotels,invoice-draft,login,message-draft,operation-draft,operational-orders,order-documents,order-draft,order-invoices,order-messages,orders,password,pickup-order,session,today,users,w1b-smoke,w1c-a-smoke}.js`
- `lib/system-{auth,finance-service,home-service,hotel-service,http,invoice-service,message-service,operations-service,order-service,rbac,user-service,user-store}.js`
- `sistema.html`, `sistema.js`, `sistema-hotels.js`, `sistema-team.js`, `sistema-team.css`
- `scripts/a7-system-users-preflight.mjs`, `scripts/build-site.mjs`
- `scripts/test-system-{finance,hotels,team-ui,users,w1c-b1}.mjs`
- `supabase/migrations/20260901030000_orlando_os_team_access.sql`
- `supabase/migrations/20260901030001_orlando_os_manager_business_permissions.sql`
- `package.json`

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-09-01 | 1.0 | Story derived directly from the Owner Goal and current authentication audit. | GPT-5 Codex |
| 2026-09-01 | 1.1 | Local RBAC, persistent users, audit, Equipe UI, tests and controlled cutover runbook completed. | GPT-5 Codex |
