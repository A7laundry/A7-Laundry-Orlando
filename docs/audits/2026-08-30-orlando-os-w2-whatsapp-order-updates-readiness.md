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

## Current official-platform verification — 2026-08-30

Current Meta-owned WhatsApp partner material and Meta's official WhatsApp Business Platform Postman collection
confirm the product boundary exposed by the Orlando onboarding:

- Embedded Signup is used by Solution Partners, Tech Providers and Tech Partners to onboard **business customers**;
- a Tech Provider is positioned as a third-party solution provider that manages WhatsApp capabilities on behalf of
  client businesses;
- Coexistence remains the required product behavior when the public number must continue operating in the WhatsApp
  Business app while the official Cloud API is connected.

The Meta screen saying the Orlando portfolio cannot be selected because it owns the provider app is therefore
consistent with the provider/client model. It must not be treated as a transient UI bug or bypassed with a Brazilian
portfolio. The exact same-portfolio restriction was observed in the authenticated Meta flow, while the public
documentation establishes the surrounding provider/customer contract.

Official references reviewed:

- `https://www.postman.com/meta/whatsapp-business-platform/collection/du6gzjv/embedded-signup`
- `https://www.whatsappbusiness.com/partners/become-a-partner/`

The lean delivery path is:

```text
W2-A  order fact → governed message draft → human review → copy/manual fallback
W2-B  same approved draft → server adapter → official Cloud API → message/status audit
W2-C  inbound conversation → safe order/lead linkage and assisted prefill
```

No autonomous sales agent is needed to make order updates useful.

### Lean implementation decision

For the current single-business Orlando operation, maintaining a multi-client Tech Provider structure is not the
default recommendation. It adds provider/client portfolio governance, app review and onboarding responsibilities
that do not improve the morning laundry workflow.

The practical sequence is:

1. release W2-A independently after its exact Production gate so the team can generate, approve and copy truthful
   order updates into the existing WhatsApp Business conversation;
2. preserve the official Bridge and the W2-B transport interface behind a single adapter;
3. obtain a bounded comparison between (a) a genuinely separate A7 provider/client structure and (b) a Meta-listed
   partner that explicitly supports Business App Coexistence for the existing US number;
4. choose the official route with the lower operational burden before implementing W2-B credentials and send
   activation;
5. keep classic number migration and WhatsApp Web automation prohibited.

This is not permission to contract a vendor, create another Meta portfolio, transfer the app, migrate the number or
activate sending. Those remain explicit Owner decisions. It is a scope decision that prevents the OS from becoming a
general WhatsApp platform when A7 needs reviewed order updates and reliable delivery/read evidence.

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

## Isolated W2-A release boundary

W2-A is already implemented and locally tested, but it remains absent from Production. Its database migration is
`20260830060000`, immediately after W1C-A `20260830050000`; it must therefore follow an accepted W1C-A cutover and
must precede W3-A `20260830070000` and W1C-B1 `20260830080000` in the official ledger.

The isolated application artifact must start from the accepted W1C-A runtime, not from the full worktree. It may add
whole files that do not exist in the W1B base:

- `lib/system-message-service.js`;
- `api/system/message-draft.js`;
- `api/system/order-messages.js`;
- `scripts/a7-system-messages.mjs`.

These shared files require a W2-A-only patch because the current worktree also contains later local slices:

- `sistema.js`;
- `sistema-w1b.css`;
- `lib/operational-store.js`;
- `package.json`.

`vercel.json` is byte-identical to the accepted W1B base and does not require a W2-A route change. Base hashes used
for future assembly verification are:

| File | Accepted W1B base SHA-256 |
|---|---|
| `sistema.js` | `6caf39906487a60b970722e53ecc2a75f576fdc70c040c48897df54d948eff1c` |
| `sistema-w1b.css` | `efd049b38b3b9b967722e74d488f71a39ef6c7b76bc622cffb968a214b997ce9` |
| `lib/operational-store.js` | `97dfec69a4cf02762954a94109aaab8bbc4434d41472775419e2da8bd5475886` |
| `package.json` | `db3bca4e8a39ed8c461a893d588df144e7aad417cfdd7fbd2c51f0a6552d3c2b` |
| `vercel.json` | `fdd8df716d08fb1a6f4c62fd6a504a8219e54d0c8f0aa6ebfa49ee59e972da2d` |

Release-negative checks must prove that the artifact contains:

- no invoice endpoint/service or migration `20260830080000`;
- no W3 known-customer branch or migration `20260830070000`;
- no `/api/whatsapp/send`, Graph API call, bridge token or WhatsApp Web automation;
- no `wa.me`/automatic conversation opening;
- no PII, message body or recipient in URL, analytics or logs;
- no Stripe, Ads, GA4, `/order` or attribution change.

## Current decision

W2-A can be released after W1C-A without waiting for Meta and provides immediate manual-copy value. W2-B and W2-C
remain blocked by the real-number Coexistence gate. W2-A does not prove official sending, and WhatsApp automation
must not bypass order truth or human review.

## W2-B story handoff — 2026-08-31

The bounded implementation contract now exists as
`docs/stories/a7-025-orlando-os-w2-b-reviewed-whatsapp-send.md`. It is deliberately `Draft` and adds no code or
activation authority. It fixes the lean boundary as one approved order update, one official Bridge send, one
provider identity/status trail and visible manual fallback. Coexistence, Business-app continuity, consented QA
round-trip and separate real-send authorization remain mandatory external gates.
