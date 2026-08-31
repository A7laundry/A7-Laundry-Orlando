# A7 Orlando OS — W2 WhatsApp Order Updates Readiness Audit

**Date:** 2026-08-30
**Scope:** human-reviewed operational order updates through the official WhatsApp channel
**Assessment only:** no Meta, WhatsApp, Supabase, Vercel or Production mutation was performed

## Executive verdict

The repository has a strong official Cloud API bridge, but the public Orlando number is not yet onboarded into the
required Coexistence flow. Therefore, the system cannot truthfully claim that `/sistema` sends order updates through
the public number today.

The successful WhatsApp Web message to the Owner proves only the manual reserve channel. It does not prove Cloud API,
order linkage, delivery receipts or Coexistence.

The lean delivery path is:

```text
W2-A  order fact → governed message draft → human review → copy/manual fallback
W2-B  same approved draft → server adapter → official Cloud API → message/status audit
W2-C  inbound conversation → safe order/lead linkage and assisted prefill
```

No autonomous sales agent is needed to make order updates useful.

## What already works

| Capability | Evidence | Status |
|---|---|---|
| Official Meta transport | Bridge calls Graph API directly; no unofficial WhatsApp Web library. | Implemented |
| Dedicated Orlando storage | Contacts, conversations and messages are stored in the North Virginia project. | Implemented |
| Webhook signature | Exact raw body is verified with `X-Hub-Signature-256`. | Implemented |
| Fast webhook ACK | Vercel `waitUntil` continues ingestion after the HTTP response. | Implemented |
| Message deduplication | `wa_message_id` is the durable inbound/outbound identity. | Implemented |
| Text send | Private bridge endpoint can send text and persist the returned Meta message ID. | Implemented technically |
| History/unread/read | Private endpoints support queue, history and local read state. | Implemented |
| Media | Authenticated media proxy validates that media belongs to a stored Orlando message. | Implemented |
| Secret boundary | System callers receive a bridge token, never the Meta token or Supabase key. | Implemented |
| Manual reserve | Owner self-message through authenticated WhatsApp Web was sent and visibly read. | Verified fallback only |

## Blocking external fact

The public number `+1 407-670-8839` is not present in the audited Orlando WABA inventory. The approved path is
Coexistence so the Business app remains operational. Embedded Signup is currently blocked because the same Meta
business portfolio owns the provider app and is being selected as the client portfolio.

Until Meta/provider-client separation is resolved and the real number passes an inbound/outbound Coexistence test:

- do not point the bridge at another US number;
- do not use any Brazil WABA;
- do not use classic onboarding that disconnects the Business app;
- do not claim `/sistema` sends through the public number;
- do not replace the official bridge with WhatsApp Web automation.

## Product gaps between the bridge and `/sistema`

### 1. No order-message contract

The bridge accepts arbitrary `to` and `text`. It does not know an `order_id`, invoice version, lifecycle state,
language, approved template, operator, approval time or idempotency identity. `/sistema` must never expose the raw
bridge endpoint directly.

### 2. No human-review state

The approved blueprint requires messages to be reviewed before send. There is no durable message-draft record with:

- order and customer linkage;
- safe template key and language;
- rendered text snapshot;
- `drafted`, `approved`, `sending`, `sent`, `delivered`, `read` or `failed` state;
- approving Owner/Operator and timestamp;
- one idempotency key per approved attempt.

### 3. No server adapter for system authentication

The browser must use its signed `/sistema` session. A server-only adapter should resolve the protected recipient,
load current order facts, render the governed template, require human approval and call the bridge using the encrypted
`WHATSAPP_BRIDGE_TOKEN`. The token, full recipient and message body must not appear in URLs, analytics or logs.

### 4. No governed operational templates

Operational messages should be deterministic before adding IA. The minimum useful set derives only from real order
states:

| Template | Required truth |
|---|---|
| Order confirmed | accepted order number, service tier, pickup window and confirmation qualifier |
| Pickup confirmed | completed pickup event and next real step |
| Received at laundry | custody `at_laundry` |
| Invoice ready | current reviewed invoice and current payment link |
| Payment confirmed | signed webhook payment state `paid` |
| Ready / out for delivery | production/custody state and factual handoff instruction |
| Delivered | explicit completed-delivery event |

Unavailable or unknown facts remain omitted; they are never invented as zero, ETA or promise.

### 5. No delivery/status correlation in the OS

The bridge stores Meta statuses, but the order timeline does not yet join an approved outbound message request to the
returned `wa_message_id`. Without this join, the system cannot prove whether a specific order update was sent,
delivered, read or failed.

### 6. No retry/escalation policy for order updates

The current bridge returns controlled Graph errors but the OS needs a bounded operational policy:

1. one approved message request;
2. one immediate send attempt;
3. bounded retry only for retryable transport failures;
4. never regenerate or alter approved text during retry;
5. visible failure in `Hoje` and manual fallback;
6. no automatic second customer message after a delivery/read receipt already exists.

## Recommended releases

### W2-A — Human-reviewed message drafts

- deterministic templates generated from current order facts;
- EN/PT/ES selected from the customer record;
- preview, approve and copy actions;
- append-only draft/approval audit;
- no Meta dependency and no automatic send;
- clipboard/manual fallback contains the exact approved text;
- CLI/service before UI.

This release gives the team useful, consistent messages even while Coexistence is externally blocked.

### W2-B — Official send and receipts

- requires successful real-number Coexistence gate;
- private same-origin system endpoint;
- server-only bridge credential;
- durable send attempt and `wa_message_id` linkage;
- Meta status joined back to the order timeline;
- fail-visible retry and manual fallback;
- no autonomous send and no marketing broadcast.

### W2-C — Inbound assisted intake

- inbound conversation linked deterministically to customer/lead/order;
- raw `A7 Ref` and CTWA referral preserved;
- message/media context shown privately;
- IA may draft only after provider/privacy approval;
- human accepts order and sends replies;
- no autonomous pricing, promise, discount or booking.

## Security and privacy invariants

1. Full phone, message body, hotel/address/room and media remain protected operational data.
2. No PII in URLs, analytics, `dataLayer`, public logs, Stripe metadata or browser errors.
3. Browser never receives Meta, bridge or Supabase credentials.
4. Every send is tied to a current order/customer and a human approval identity.
5. QA orders cannot send to a real recipient.
6. Idempotent retry cannot duplicate a customer message.
7. Out-of-window/template restrictions fail visibly; they do not silently switch message type.
8. Kill switch disables API sending without breaking the Business app or manual fallback.

## Required proof before declaring WhatsApp order updates complete

- public number onboarded through Coexistence;
- Business app still sends and receives;
- one synthetic inbound message appears in `/sistema`;
- one reviewed order update sends from `/sistema` to a consented QA recipient;
- the same message appears in the Business app thread;
- Meta `sent`, `delivered` and `read` statuses join the correct order/message request;
- duplicate approval/retry creates no second message;
- wrong order, QA order, non-Owner/unauthorized and wrong-origin requests fail closed;
- no PII/secret leak in URL, analytics or logs;
- kill switch and manual fallback are demonstrated;
- no Google Ads or autonomous agent change is bundled.

## Current decision

W2-A can be specified after the financial/cutover sequence without waiting for Meta. W2-B and W2-C remain blocked by
the real-number Coexistence gate. The correct next operational release remains W1B, followed by W1C-A and the bounded
financial slices. WhatsApp automation must not bypass those order facts.
