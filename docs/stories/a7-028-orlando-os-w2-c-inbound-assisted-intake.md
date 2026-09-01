# Story A7-028 — A7 Orlando OS W2-C Inbound Assisted Intake

**Status:** Draft / Blocked — W2-B must be accepted and stable on the official Coexistence channel before implementation

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§3.2, 6.2–6.4, 7, 15.3, 16–18 and 21–22; Operational Attribution
Contract §§3, 5.2, 6–10 and 16; Measurement V2 privacy boundary; W2 WhatsApp Readiness Audit; Stories A7-014,
A7-021 and A7-025

**Depends on:** A7-021 W2-A accepted in Production; A7-025 W2-B accepted in Production and stable on the public
Orlando number through official Coexistence; W0/W1A customer, lead and order services preserved

## Story

**As the** A7 Orlando Owner,

**I want** inbound WhatsApp conversations to appear in a minimal private inbox and prepare a reviewable intake from
deterministically linked facts,

**so that** the team can begin qualification without retyping known information while a human remains the only
authority for price, promise and order acceptance.

## Business context

The WhatsApp Business conversation remains the customer channel and `/sistema` remains the operational truth. W2-C
connects those two surfaces only far enough to organize a real inbound inquiry:

```text
signed official inbound webhook
→ idempotent message/contact/conversation ingestion
→ durable lead created or resolved
→ deterministic identity and attribution resolution
→ minimal private inbox/history
→ reviewable Atendimento prefill
→ human qualifies and edits
→ existing W1A confirmation service may create the order
```

An inbound message proves contact and conversation activity. It does not prove service eligibility, coverage,
availability, price acceptance, pickup confirmation or a sale. `Criar pedido` remains the existing human-controlled
boundary that emits `order_accepted`.

[Source: `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md` §§3.2, 6.2–6.4, 7]
[Source: `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md` §§3.2, 5.2]

## Scope lock

Only W2-C is in scope:

- a compact Owner-private inbox of inbound conversations and unread state;
- protected conversation history and authenticated access to already-governed media;
- sanitized channel health and explicit manual fallback;
- idempotent creation or resolution of the contact, conversation and unqualified lead from a valid inbound message;
- deterministic linkage to existing protected customer, lead, attribution or order relationships only when the
  authoritative server-side evidence is unique and exact;
- preservation of validated `A7 Ref` and CTWA referral fields in protected storage;
- a reviewable prefill into the existing Atendimento flow using only already-known structured facts;
- explicit human edit/confirmation before the existing W1A order service is invoked.

W2-C does not add AI, free-text extraction, autonomous replies, generic chat composition, pricing logic, availability
logic, promises, automatic qualification, automatic order creation, marketing, campaign sending, WhatsApp Web
automation, invoice/payment behavior or a second operational authority.

## Deterministic inbound and linkage contract

### Valid inbound boundary

A message is eligible to create or resolve inbound intake only when all of these are true:

1. it arrived through the official Orlando Bridge webhook with a valid Meta signature;
2. it is an inbound customer message, not a status callback, outbound echo, historical synchronization record or
   unsupported system event;
3. it has a durable unique provider `wa_message_id` and a protected Orlando conversation/contact identity;
4. ingestion of that exact provider identity has not already created the same business effect.

The first eligible message for an unlinked conversation creates or resolves one `lead_id` with `new` status. Later
messages in the same durably linked inquiry update inbox activity only; they do not create another lead. An exact
webhook retry returns the prior ingestion result and cannot increment unread state or create a second lead twice.

### Allowed deterministic resolution

The server may use only these evidence classes:

1. an existing persisted conversation → lead/customer/order relationship;
2. an exact validated `A7 Ref` resolved through the protected attribution store, which may attach attribution and a
   known lead relationship but must not select an order by itself;
3. an exact protected WhatsApp/contact match to one durable customer, when the match is unique and the server records
   its source;
4. an exact CTWA identifier already mapped in protected storage to the same acquisition/lead context;
5. an explicit Owner selection from safe candidates when automatic resolution is absent or ambiguous.

Phone similarity, profile-name similarity, hotel/property, room, message text, amount, timestamps, language,
operator recollection or proximity to another order are never sufficient to auto-link an order. If evidence is
missing or ambiguous, the conversation remains visibly unlinked and the prefill contains only safe facts whose source
is known.

### Order boundary

An existing order may be displayed as related only from a pre-existing exact server-side relation. W2-C never chooses
an order from phone, `A7 Ref`, free text or timing alone. Creating a new order always requires the authenticated human
to review the Atendimento form and invoke the existing W1A confirmation service. W2-C itself emits no
`qualified_guest_lead` or `order_accepted` event.

[Source: `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md` §§3.1–3.2, 5.2, 8]
[Source: `docs/measurement-v2-foundation.md` §§Attribution V2, A7 Ref V2, Privacy Boundaries]

## Minimal Owner flow

```text
Atendimento
→ Inbox
→ Não lidas primeiro
→ abrir conversa
→ ver histórico/mídia protegida + vínculo/atribuição disponíveis
→ USAR NO ATENDIMENTO
→ revisar cliente, idioma, local, serviço solicitado, janela e needed-by
→ corrigir ou completar fatos manualmente
→ seguir para a confirmação humana já existente
```

The inbox is not a general-purpose CRM or chat client. The list needs only protected contact display, unread count,
last activity, supported message indicator, linkage state and whether human action is pending. It may reuse W2-B's
approved order-message controls in context, but W2-C adds no arbitrary reply box and never sends automatically.

## Reviewable prefill contract

Prefill may contain only structured facts already present in a protected authoritative record, with provenance and
availability visible to the human:

- customer/contact identity resolved server-side;
- language when durably known, otherwise `unknown`;
- customer/accommodation type when durably known;
- protected property/handoff facts already stored for this inquiry/customer;
- existing `A7 Ref`/attribution availability and confidence;
- conversation reference and safe human-readable context;
- service, tier, pickup window, `needed_by`, load estimate or notes only when they already exist as structured inbound
  or intake facts—not by parsing free text in this story.

Unknown remains blank/unknown. The human may edit the intake before confirmation. The prefill never calculates or
returns a price, minimum, discount, availability decision, Express commitment, ETA, pickup confirmation or final
customer-facing response.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Ingest each valid inbound provider message once and resolve one protected contact/conversation identity without duplicate unread or lead effects. | A7-014 channel invariants; Bridge schema |
| FR-02 | Create or resolve one durable unqualified lead for the current inbound inquiry; message receipt alone never qualifies or accepts it. | Attribution Contract §§3.2 and 5.2 |
| FR-03 | Present a minimal private inbox ordered by unread/action need and last activity, with explicit empty, unavailable and channel-degraded states. | Blueprint §§6.2, 15.3; W2 readiness audit W2-C |
| FR-04 | Present protected history in chronological order and expose supported media only through authenticated ownership-checked access. | A7-014 bridge-first recut; W2 readiness audit What already works |
| FR-05 | Resolve customer, lead, attribution and existing order relations only through the allowed deterministic evidence hierarchy; ambiguous evidence remains unresolved. | Attribution Contract §§3 and 8; Measurement V2 |
| FR-06 | Preserve validated `A7 Ref`, CTWA identifiers and referral source in protected storage without exposing raw values outside the approved boundary. | A7-014; Attribution Contract §§7–9 |
| FR-07 | Prepare a reviewable Atendimento prefill from known structured facts and provenance; unknown fields remain unknown. | Blueprint §§6.2–6.4, 7.2 |
| FR-08 | Reuse the existing W1A human confirmation service for any later order creation; W2-C itself cannot qualify or accept an order. | Blueprint §§7.1–7.3 |
| FR-09 | Mark-read and prefill actions are separately authorized, audited and idempotent; exact retry returns the prior result and conflicting reuse fails closed. | Blueprint NFR-02; existing Bridge read contract |
| FR-10 | Sanitized channel health and manual WhatsApp Business fallback remain visible when inbound APIs, storage or media are unavailable. | A7-014 Coexistence safety; W2 readiness audit |
| NFR-01 | CLI/service contracts precede API/UI; browser contains no identity resolution, lead creation, eligibility or order authority. | AIOS Constitution I; Blueprint CON-02 |
| NFR-02 | Initial release is Owner-only, private, same-origin, method-restricted and submission-bound for mutations. | Blueprint §16; W0 boundary |
| NFR-03 | Phone, name, message body, transcript, property/address/room, media, raw referral/click IDs and secrets remain protected and never enter URLs, analytics, `dataLayer`, Stripe metadata, public logs or evidence. | Attribution Contract §9; Measurement V2 Privacy Boundaries |
| NFR-04 | Bridge, Meta and Supabase credentials remain server-only; browser receives only minimum safe references and protected display data required for the active Owner session. | W2 readiness audit Security and privacy invariants |
| NFR-05 | Failures are visible and fail open to the existing manual Business app workflow without creating false success, duplicate lead/order or lost provider identity. | Blueprint NFR-04; A7-014 operation invariant |
| CON-01 | No IA/model call, free-text extraction, translation, summary, autonomous response or agent activation. | Master prompt W2-C/W2-D boundary |
| CON-02 | No automatic pricing, minimum, discount, coverage, Express availability, timing promise, qualification, order creation, cancellation or operational transition. | Blueprint §§6.5–6.6; Attribution Contract §3.2 |
| CON-03 | No WhatsApp Web automation, classic number migration, alternate WABA/number, marketing, broadcast, upsell or arbitrary outbound composition. | A7-014 decisions; A7-025 non-goals |
| CON-04 | No Stripe, invoice, payment, refund, delivery, GA4, Google Ads, `/order` or frozen attribution mutation. | Attribution Contract §§5.2, 8, 14; release isolation |
| CON-05 | No implementation, migration, channel activation or Production release until every blocking gate below is evidenced and a separate exact GO is recorded. | Blueprint CON-01; master prompt authorization matrix |

## Acceptance criteria

- [ ] A valid first inbound text creates one contact/conversation relation and one `new` lead; exact and delayed webhook
  retries return the prior result without a second lead or unread increment.
- [ ] Later inbound messages in the same durably linked inquiry append once to history and reuse the same lead rather
  than creating a lead per message.
- [ ] Status callbacks, outbound echoes, historical sync rows, malformed messages and invalid-signature webhooks cannot
  create inbound leads or prefill effects.
- [ ] Inbox list shows unread count, last activity, supported message indicator, deterministic linkage state and pending
  human action without exposing full phone, raw referral IDs or technical UUIDs.
- [ ] History is ordered deterministically; text/caption and supported media are available only in the authenticated
  Owner context, and media access rejects a foreign/unknown message.
- [ ] Existing persisted linkage resolves correctly; a unique protected contact match may resolve a customer; ambiguous
  or multiple matches remain visibly unresolved.
- [ ] `A7 Ref` and CTWA evidence are stored/resolved exactly once; they may preserve attribution/lead context but cannot
  select an existing order without an already-persisted exact order relation.
- [ ] Name, hotel, room, message content, amount and timing similarity never auto-link a customer, lead or order.
- [ ] Prefill contains only known structured values plus provenance/availability; unknown fields remain blank/unknown
  and no free-text parser silently promotes message content to facts.
- [ ] Human can edit/review the prefill before invoking the existing confirmation flow; opening a conversation or
  generating prefill creates no `qualified_guest_lead`, `order_accepted`, price, promise or pickup commitment.
- [ ] Mark-read and prefill retries are idempotent; conflicting idempotency reuse and stale conversation state fail
  closed without duplicated audit or business effects.
- [ ] Owner succeeds; unauthenticated, non-Owner, wrong-origin, wrong-method and missing/invalid submission identity
  requests fail closed.
- [ ] Channel/storage/media failure is visible, does not fabricate empty success and leaves the manual WhatsApp Business
  app workflow available.
- [ ] No arbitrary reply composer, automatic outbound message, marketing action, WhatsApp Web automation, IA/model call
  or Graph send is introduced by W2-C.
- [ ] No order, lifecycle, custody, production, invoice, payment, Stripe, delivery, GA4, Ads, `/order` or frozen
  attribution mutation occurs in focused or release tests.
- [ ] No PII, message/media content, raw referral/click ID or secret appears in URL/query string, analytics,
  `dataLayer`, public/application logs, browser error, static bundle or redacted evidence.
- [ ] CLI/service, API, isolated SQL, webhook signature/deduplication, authorization, privacy and regression tests pass.
- [ ] Actual private UI at desktop and exact 390 px shows inbox, unread/empty/degraded states, history and reviewable
  prefill without horizontal overflow or a generic CRM layout.
- [ ] Exact release artifact contains only W2-C changes on the accepted W2-B baseline; migration ledger, rollback,
  authenticated Owner smoke and zero-residue synthetic probe are evidenced before Production.
- [ ] No real inbound customer test or Production mutation occurs without a separate exact Owner GO naming channel,
  consented QA identity, artifact, migration, smoke and rollback.

## Tasks / Subtasks

- [ ] Close dependency and privacy gates before development (AC: all)
  - [ ] Prove W2-A and W2-B are accepted in Production on the official Orlando Coexistence number.
  - [ ] Prove Business app continuity, signed inbound/outbound QA round-trip, status correlation, kill switch and manual
    fallback from A7-025.
  - [ ] Inventory current Bridge retention, media access, protected storage and log redaction; do not expand retention or
    copy message/media data to a new store without an approved contract.
  - [ ] Reconfirm official Orlando Supabase/Vercel targets and reject unrelated project/number/WABA credentials.
- [ ] Define the service-first inbound contract (AC: 1–11)
  - [ ] Specify valid inbound versus status/echo/history events and one durable business effect per `wa_message_id`.
  - [ ] Specify conversation → lead creation/resolution and deterministic customer/attribution/order linkage outcomes.
  - [ ] Define safe inbox/history/prefill response contracts with unavailable and ambiguous states.
  - [ ] Define mark-read and prefill idempotency identities, stale-state handling and append-only audit evidence.
- [ ] Implement additive protected data relationships only if the existing schema cannot represent them (AC: 1–11)
  - [ ] Add the minimum conversation-to-lead/customer/order relationship and provenance needed for deterministic reads.
  - [ ] Keep service-role-only grants, RLS/revocations, unique constraints and concurrency controls aligned with the
    existing Bridge and Orlando OS patterns.
  - [ ] Provide an exceptional rollback that refuses to delete any real inbound/linkage evidence.
- [ ] Implement CLI/service and private API before UI (AC: 1–17)
  - [ ] Add inbox, conversation history, safe media and prefill service contracts behind the `/sistema` session.
  - [ ] Reuse Bridge webhook signature, ingestion and media ownership authority instead of creating a second webhook.
  - [ ] Reuse W1A for later human-confirmed order creation; do not add an order write path to the inbox service.
  - [ ] Add sanitized channel health and explicit manual fallback states.
- [ ] Add the minimal Atendimento UI (AC: 4–10, 13–18)
  - [ ] Add inbox/unread and selected conversation context inside Atendimento, not as new main navigation.
  - [ ] Add `Usar no atendimento` with source/unknown indicators and human-editable review before confirmation.
  - [ ] Preserve keyboard access, concise mobile layout and no technical identifiers.
- [ ] Prove isolation and safety (AC: all)
  - [ ] Test duplicate/delayed/concurrent inbound, multiple messages per inquiry, invalid signature, status/echo/history,
    ambiguous identity, missing attribution, foreign media, stale version and channel/storage failure.
  - [ ] Test that no case creates price, promise, qualification, order or outbound send without human action.
  - [ ] Run focused Bridge/W2-A/W2-B/W1A regressions, lint, typecheck, full tests, build, privacy/secret scan and
    `git diff --check`.
  - [ ] Render the exact private UI at 390 px and desktop and prepare an isolated release audit/rollback.

## Dependencies and blocking gates

### G0 — W2-B stable official channel — BLOCKING

Implementation must not begin until A7-025 is accepted in Production and proves:

- public Orlando number onboarded through official Coexistence;
- WhatsApp Business app continuity;
- consented QA inbound/outbound round-trip;
- provider identity and `sent`/`delivered`/`read` correlation exactly once;
- kill switch and manual-copy fallback;
- no duplicate customer send under retry/concurrency.

W2-A manual copy or a WhatsApp Web message does not satisfy this gate.

### G1 — Deterministic identity/linkage design — BLOCKING

Before schema or service implementation, a data/architecture review must map the existing Bridge contact,
conversation and message identities to the operational `customer_id`, `lead_id`, `order_id`, attribution snapshot and
`A7 Ref` contracts. The review must prove:

- exact allowed link paths and ambiguity behavior;
- no phone/name/content/timestamp-based order inference;
- one active durable inquiry link per conversation without deleting historical evidence;
- append-only provenance for manual Owner resolution;
- no rewrite of frozen attribution or existing order history.

### G2 — Privacy, retention and media boundary — BLOCKING

Before implementation, verify and record:

- which protected system is authoritative for message bodies, transcripts and media metadata;
- retention/deletion and access boundaries already approved for the Bridge;
- that W2-C reads rather than duplicates protected content wherever possible;
- media ownership checks, authenticated proxy behavior and failure handling;
- redaction for logs, analytics, browser errors, QA artifacts and screenshots.

If the existing policy does not authorize a proposed copy, retention extension or new consumer, stop and obtain a
separate privacy decision. W2-C contains no IA provider and does not authorize sending conversation data to a model.

### G3 — Release isolation and Production GO — BLOCKING

- apply only the migration(s) required by W2-C in official chronological order;
- assemble from the accepted immutable W2-B baseline;
- prove negative diff for IA, outbound send, Stripe, financial, Ads, `/order` and attribution changes;
- execute local/isolated gates and zero-residue synthetic probe;
- obtain a separate exact Owner GO before any migration, channel QA message or Production cutover.

## Rollback

1. The channel kill switch and the accepted W2-B/W2-A manual-copy path remain the immediate operational fallback.
2. Application rollback restores the last accepted W2-B artifact and removes only W2-C inbox/prefill presentation and
   private endpoints. Existing official Bridge ingestion continues independently.
3. Additive conversation/linkage schema may remain inert after application rollback so durable inbound evidence is not
   lost.
4. Exceptional SQL rollback may remove only unused W2-C functions/tables when there is no real inbound, linkage,
   provenance or audit evidence. Once evidence exists, rollback must fail closed and preserve history.
5. Rollback never deletes messages, unread history, customer/lead/order records, attribution snapshots or provider
   identities, and never migrates/disconnects the public number.
6. If a smoke exposes PII, wrong linkage, duplicate lead/order or false commitment, stop immediately, disable W2-C,
   restore the prior application artifact and report `NOT READY`; do not patch or merge real customer data to make the
   smoke pass.

## Explicit non-goals

- IA/model integration, translation, summarization, extraction or autonomous agent behavior;
- automatic or suggested price, minimum, discount, coverage, availability, Express promise, ETA or pickup commitment;
- automatic lead qualification, order acceptance, cancellation or state transition;
- arbitrary reply editor, generic chat client, autonomous reply or outbound send added by this slice;
- marketing, campaigns, broadcast, nurture, follow-up, upsell, loyalty or CRM segmentation;
- WhatsApp Web automation or unofficial WhatsApp library;
- classic migration, alternate number/WABA/database or Business-app interruption;
- fuzzy identity, automatic merge, customer reconciliation or destructive overwrite;
- bulk chat import, data warehouse, transcript analytics or sentiment analysis;
- customer portal, public conversation link or message content in notifications;
- invoice, Payment Link, Stripe, payment, refund, delivery or route behavior;
- Google Ads, GA4, Meta campaign, `/order`, SEO or frozen attribution changes.

## Testing guidance

- Use synthetic Orlando-only fixtures clearly marked QA; never use a real customer conversation for automated tests.
- Cover first inbound, later inbound in same conversation, exact retry, delayed retry and simultaneous duplicate.
- Cover signed versus invalid/absent webhook, inbound versus echo/status/history and supported/unsupported message types.
- Cover existing relation, unique exact protected match, ambiguous match, no match, valid/invalid `A7 Ref`, CTWA
  present/absent and an unrelated order with similar time/property that must not link.
- Assert provider event time remains event time and server record time remains distinct.
- Assert the same lead is reused for the durably linked inquiry while a separate future inquiry can receive a new lead
  without changing `customer_id` or prior history.
- Assert history/media access cannot cross conversation ownership and raw provider media URLs are never exposed.
- Assert response bodies, HTML, URLs, logs, analytics, error traces and screenshots satisfy the data-placement matrix.
- Assert no outbound Graph call, model call, order creation, qualification, pricing or state transition occurs.
- Run repository-required `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`, plus Bridge regressions,
  structure/agent validation and `git diff --check` at the implementation gate.

## Dev notes

### Existing foundation to preserve

- The official Bridge already validates webhook signatures, deduplicates `wa_message_id`, ingests contacts,
  conversations/messages/statuses, exposes unread/history/read and protects media through a server proxy.
  [Source: `lib/whatsapp-bridge.js`; `api/whatsapp/webhook.js`; `api/whatsapp/unread.js`;
  `api/whatsapp/history.js`; `api/whatsapp/read.js`; `api/whatsapp/media.js`]
- The Bridge schema already stores `wa_id`, `conversation_id`, message direction/source/type, text/caption, media
  metadata, reply identity, referral JSON, provider occurrence time, historical flag and unread state under
  service-role-only access.
  [Source: `supabase/migrations/20260827010000_whatsapp_orlando_bridge.sql`]
- W1A remains the only accepted customer/lead/order confirmation boundary. W2-C must call that existing application
  service only after human review; it must not recreate its transaction in an inbox endpoint.
  [Source: Orlando OS blueprint §§7.1–7.3; Operational Attribution Contract §3.2]
- W2-A freezes human-approved operational text; W2-B owns official outbound send/status. W2-C owns inbound
  organization and prefill only.
  [Source: Stories A7-021 and A7-025]

### Conceptual private APIs from the approved blueprint

- `GET /api/system/inbox` — conversations/non-read state;
- `GET /api/system/conversations/:id` — protected history;
- W2-C may add a private prefill action tied to the opaque conversation reference, but order creation remains the
  existing W1A service.

[Source: Orlando OS blueprint §15.3]

### Project structure notes

- Reuse `lib/whatsapp-bridge.js` and its current webhook/media authority; do not create a parallel Meta ingestion
  stack.
- Reuse the existing `/sistema` authentication and same-origin helpers used by private APIs.
- Add the minimum service/API/UI surface only after G1 defines the exact linkage record; do not choose schema or new
  file names merely from this Draft story.
- Update this story's File List during implementation with every actual code, migration, rollback, test and audit file.

## Testing

The implementation must include unit/service, API authorization, isolated PostgreSQL, webhook regression,
idempotency/concurrency, privacy/secret and visual tests. Production tests require a separate exact GO and consented
QA identity; no real customer message may be used to prove the slice.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use the repository's manual review and required quality gates.

## Story draft validation

| Category | Status | Notes |
|---|---|---|
| Goal & context clarity | PASS | Inbound organization, human boundary and business value are explicit. |
| Technical implementation guidance | PASS | Existing Bridge, identity hierarchy, APIs, invariants and test surface are identified. |
| Reference effectiveness | PASS | Requirements trace to the blueprint, attribution/privacy contracts and preceding W2 stories. |
| Self-containment | PASS | Valid inbound, deterministic linkage, prefill and failure behavior are defined in the story. |
| Testing guidance | PASS | Duplicate, ambiguity, privacy, authorization, regression and visual cases are measurable. |
| CodeRabbit integration | N/A | Configuration is not enabled; manual quality gates apply. |

**Readiness:** `BLOCKED` until G0–G2 are evidenced. Once unblocked, the story is sufficiently specified for an
implementation gate without expanding into W2-D or autonomous messaging.

## Change Log

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-08-31 | 0.1 | Initial Draft/Blocked W2-C contract for deterministic inbound, minimal inbox and reviewable prefill. | River (@sm) |

## File List

- `docs/stories/a7-028-orlando-os-w2-c-inbound-assisted-intake.md`
