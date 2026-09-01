# Story A7-025 — A7 Orlando OS W2-B Reviewed WhatsApp Send and Receipts

**Status:** Draft — implementation and real sending blocked by Coexistence gate

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§7, 15 and 16; Story A7-014; Story A7-021; W2 WhatsApp readiness audit

**Depends on:** W2-A accepted in Production; official Coexistence onboarding of `+1 407-670-8839`; Business app
continuity and consented QA round-trip proven

## Story

**As the** A7 Orlando Owner,

**I want** to review and send a factual order update from the order screen through the official WhatsApp channel,

**so that** the customer receives the right status once and the team can see whether that exact update was sent,
delivered, read or failed.

## Scope lock

W2-B connects an already-approved W2-A message snapshot to the existing official Orlando Bridge. It adds one
order-bound send operation, durable provider identity/status and visible failure/manual fallback.

It does not add autonomous IA, arbitrary chat composition, campaigns, bulk messaging, upsells, WhatsApp Web
automation, customer portal, invoice authority, payment authority, state transitions from messages or a generic
omnichannel inbox.

## External activation gates

No W2-B transport code may be enabled or tested against a real recipient until all are evidenced:

1. the Owner chooses an official Coexistence-capable provider/client route;
2. public number `+1 407-670-8839` is onboarded through Coexistence, never classic migration;
3. the WhatsApp Business app on the A7 phone still sends and receives;
4. a consented QA recipient completes inbound and outbound Cloud API round-trip;
5. the API-sent bubble appears in the same Business app conversation;
6. `sent`, `delivered` and `read` receipts are returned and stored once;
7. the Owner gives a separate exact GO for first real-customer send.

Brazil WABAs, other US numbers, the unrelated Supabase project `zquefoznqwkfbnnfalmt`, WhatsApp Web automation and
classic number migration are forbidden substitutes.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Send only a current W2-A draft whose exact text was explicitly approved by an authenticated Owner. | Blueprint human authority |
| FR-02 | Resolve recipient, order, customer, language and approved text server-side; browser supplies no phone or arbitrary body. | Privacy boundary |
| FR-03 | Call only the dedicated official Orlando Bridge through a server-held bridge token. | Story A7-014 |
| FR-04 | Persist one send request, one provider `wa_message_id` and append-only status history tied to the order/draft. | Readiness audit |
| FR-05 | Exact retry returns the prior request/result and never sends a second customer message. | Idempotency invariant |
| FR-06 | Concurrent send attempts converge to one governed request or fail closed before a second Graph call. | Concurrency invariant |
| FR-07 | Retry uses the frozen approved text; it never regenerates, translates or edits it. | Human review boundary |
| FR-08 | Retryable transport failures are bounded; permanent/window/template failures become visible and preserve manual copy. | Operational fallback |
| FR-09 | Provider statuses advance monotonically and cannot change order, invoice, payment or attribution state. | Order authority |
| FR-10 | QA/cancelled/wrong-order/stale draft/unknown recipient and unsupported channel states fail closed. | Existing invariants |
| FR-11 | A channel kill switch prevents API sends without breaking the Business app or manual-copy workflow. | Coexistence safety |
| NFR-01 | Owner-only initial release, private same-origin POST, signed HttpOnly submission identity. | W0/W2-A security |
| NFR-02 | No phone, message body, property, room, media, token or provider payload in URLs, analytics or logs. | PII boundary |
| NFR-03 | Bridge/Meta/Supabase secrets remain server-only and are never returned to `/sistema`. | Secret boundary |
| NFR-04 | Failure is explicit; no successful UI state without a durable provider message ID. | Truthful state |
| CON-01 | W2-B never sends automatically because an order state changed. | MVP scope |
| CON-02 | W2-B never changes Stripe, GA4, Google Ads, `/order` or frozen attribution. | Release isolation |

## Lean state model

```text
approved draft
→ send_requested
→ sending
→ sent
→ delivered
→ read

sending → retryable_failed → sending
sending → failed
```

Rules:

- one send request owns one approved draft version and one order;
- `sent` requires a durable `wa_message_id` returned by the official Bridge;
- `delivered` and `read` require provider evidence for that same ID;
- status regressions and duplicate callbacks are ignored/audited, not rewritten;
- retry count and next retry time are bounded server facts;
- manual copy remains available after failure but does not masquerade as API delivery.

## Minimal operator flow

```text
Pedido
→ Atualizações
→ abrir rascunho aprovado
→ REVISAR E ENVIAR
→ confirmar destinatário protegido + idioma + pedido
→ enviar uma vez
→ mostrar Enviado / Entregue / Lido / Falhou
```

The UI may show last four phone digits and the exact approved message in the private Owner session. It must not
become a full chat client in this slice.

## Acceptance criteria

- [ ] A disabled transport adapter can be tested locally without network or Meta credentials.
- [ ] Service/CLI dry-run resolves the approved draft and explains the intended send without exposing recipient/body.
- [ ] Owner API returns 401 unauthenticated, 403 non-Owner and rejects wrong-origin/missing submission identity.
- [ ] Browser cannot supply phone, message text, provider ID, status or order/customer UUID.
- [ ] First synthetic adapter send records one request and one provider ID for the exact approved snapshot.
- [ ] Exact retry and a concurrent duplicate produce no second adapter/Graph call.
- [ ] Status reconciliation accepts sent/delivered/read once and rejects regression/conflicting message identity.
- [ ] Retryable and permanent failures remain distinguishable, bounded and visible with manual fallback.
- [ ] Kill switch prevents transport calls while W2-A preview/copy remains usable.
- [ ] QA, cancelled, stale, copied-only, wrong-order and recipient-missing cases fail closed.
- [ ] No order lifecycle, invoice, payment, Stripe, GA4, Ads, `/order` or attribution mutation occurs.
- [ ] No PII/secret appears in URL, logs, analytics, browser error or public artifact.
- [ ] Desktop and 390 px show one concise send/status control, not a parallel inbox.
- [ ] Focused tests, Bridge regressions, lint, typecheck, full tests, build and secret scan pass.
- [ ] Coexistence six-gate proof passes before any real-number activation.
- [ ] First consented QA send and first real-customer send each require separate explicit Owner GOs.

## Implementation order

```text
external Coexistence decision and proof
→ additive send/status ledger
→ disabled/fake transport adapter
→ service + CLI dry-run
→ Owner-only API
→ minimal /sistema action
→ synthetic adapter and concurrency tests
→ isolated artifact gate
→ consented QA send GO
→ observation and rollback proof
→ separate first real-customer GO
```

## Rollback

Primary rollback disables the transport kill switch and restores the last accepted W2-A application. The Business
app and W2-A copy/manual fallback remain available. Append-only send/status evidence stays intact. Schema removal is
forbidden after any provider message identity exists.

## Explicit non-goals

- autonomous agent replies or automatic status messages;
- marketing messages, broadcast, follow-up campaign or upsell;
- arbitrary text box or general-purpose inbox;
- WhatsApp Web automation;
- number migration away from the Business app;
- invoice/Payment Link/payment/delivery authority;
- importing full historical chats into the OS;
- Operator sending, until a separate permission gate is approved;
- another WABA, phone number, database or provider as a shortcut.

## File List

- `docs/stories/a7-025-orlando-os-w2-b-reviewed-whatsapp-send.md`
