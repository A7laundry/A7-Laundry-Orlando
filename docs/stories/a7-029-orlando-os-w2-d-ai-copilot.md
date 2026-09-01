# Story A7-029 — A7 Orlando OS W2-D AI Copilot

**Status:** Draft / Blocked — W2-C is not accepted and the AI provider/privacy policy is not approved

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§1–3, 6.2–6.7, 15–18 and 21–22; Full Delivery Goal Prompt §7 W2-D;
Operational Attribution Contract §§3, 5, 8–12; Measurement V2 privacy/failure boundaries; WhatsApp order-updates
readiness audit; Stories A7-021 and A7-025

**Depends on:** W2-A accepted in Production; A7-025 W2-B accepted and stable; W2-C inbound conversation linkage
accepted and stable; Owner approval of every Gate G0 decision in this story

## Story

**As the** A7 Orlando Owner,

**I want** a fail-open AI copilot that prepares a faithful translation, summary, explicit-fact extraction and response
proposal from the protected conversation context,

**so that** the team can understand and answer customers faster without giving an AI authority to speak for A7 or
change the laundry operation.

## Business context

The Orlando OS is a small operational system centered on the order. It is not an autonomous sales agent, generic
CRM or AI platform. W2-A already defines governed human-reviewed drafts; W2-B defines reviewed official sending;
W2-C will provide deterministic inbound conversation linkage. W2-D may assist those human flows, but it cannot
become another source of customer, order, commercial or operational truth.

The safe boundary is:

```text
protected conversation + approved minimal order context
→ redaction/minimization
→ AI translation/summary/explicit-fact extraction/proposed draft
→ schema and policy validation
→ human review and correction
→ existing W2-A approval boundary
→ optional existing W2-B human send boundary
```

The AI result is an untrusted proposal. It is not a message sent, a fact confirmed, an accepted order, a price,
a promise or a state transition.

## Scope lock

Only W2-D is in scope: an Owner-private, fail-open copilot that can translate, summarize, extract explicitly stated
facts and prepare a response proposal for human review. It may identify missing or contradictory information, but
must preserve uncertainty and point back to the source excerpts used.

W2-D has no WhatsApp transport, order application, pricing, invoice, payment, refund, delivery, attribution,
analytics or lifecycle authority. It does not create a generic chat interface, autonomous agent, campaign engine,
knowledge-base platform, vector database or new customer-facing channel.

No implementation may begin and no provider may receive any real conversation or PII until the Owner approves the
provider/model and complete privacy decision record in Gate G0.

## Authority boundary

### The copilot may

- detect the likely language and propose a target language;
- translate an approved, minimized conversation excerpt;
- summarize what the customer explicitly said;
- extract explicitly stated service, timing, quantity/bag estimate, accommodation type and handoff facts that the
  approved PII matrix permits;
- flag missing, ambiguous or contradictory information;
- prepare questions or a response proposal using only approved facts and governed text supplied by the server;
- prefill a review form while leaving every proposed field visibly unconfirmed;
- explain which source excerpt supports each extracted fact.

### The copilot must never

- send, schedule, retry or acknowledge a WhatsApp message;
- claim that a message was sent, delivered or read;
- accept, reject, cancel, qualify or create a lead/order;
- promise availability, pickup, Express, turnaround, needed-by time, ETA, coverage or Bell Desk completion;
- invent a customer fact, service, quantity, weight, price, minimum, discount, fee, tax, total or policy;
- calculate or confirm final price, invoice value, refund, revenue or payment status;
- call Stripe, Meta, Supabase mutations, GA4, Google Ads or any operational endpoint;
- modify customer, conversation, lifecycle, custody, production, invoice, payment, attribution or delivery state;
- treat its own summary or extraction as evidence that overrides the original protected source;
- train, learn a customer profile or retain memory across conversations outside the approved provider/privacy policy.

There is no model tool calling or function calling in this slice. The provider receives a bounded request and returns
a bounded proposal; application services remain the sole authorities for reads, writes and external actions.

## Gate G0 — Owner provider and privacy decision — BLOCKING

Before implementation, the Owner must approve a dated decision record covering every row below. A blank, assumed,
provider-default or “industry standard” answer is not approval.

| Decision | Required approved evidence |
|---|---|
| Provider and model | Exact provider, model/family, API product, account/tenant owner and approved model-change policy. Silent provider/model substitution is forbidden. |
| Processing region | Processing/data-residency region, permitted cross-border transfers, subprocessors and the operational consequence if the requested region is unavailable. |
| Retention | Retention for provider inputs, outputs, abuse/safety logs, application-side AI proposals, backups and failed requests; unknown retention is a blocker. |
| Training | Written evidence that A7 inputs/outputs are not used to train or improve provider/shared models, or an explicit Owner-approved exception. Default recommendation: no training. |
| Redaction | Exact pre-provider redaction/tokenization rules, placeholder behavior, post-response leak scan and fail-closed behavior when redaction cannot be proven. |
| Logs | Exact fields allowed in application/provider diagnostic logs, who can access them and retention. Raw message, phone, email, address, property, room and media are forbidden by default. |
| Deletion | Customer-request and retention-expiry deletion procedure covering A7 storage, provider storage, backups where applicable, audit proof and expected completion time. |
| PII allowlist | Field-by-field matrix naming which PII may be transmitted, for which copilot operation, purpose, source, retention and redaction. Anything absent is forbidden. |
| Notice/consent basis | Approved customer notice/consent or other reviewed basis applicable to the chosen data flow. This story does not make a legal determination. |
| Manual fallback | Named manual workflow and kill switch that keep Atendimento, W2-A review/copy and W2-B reviewed send usable with AI disabled. |

### Proposed safest PII baseline for Owner review

This proposal is not authorization. The Owner may approve a stricter matrix; any expansion requires story revision
and a new privacy gate.

| Field | Proposed provider treatment |
|---|---|
| Conversation excerpt required for the selected operation | Allowed only after deterministic minimization/redaction and only for the current invocation. |
| Source and target language | Allowed as categorical values. |
| Governed service/tier labels | Allowed only when loaded server-side from the current approved catalog/context. |
| Customer name, full phone/WhatsApp ID, email | Redact before provider transmission. |
| Exact hotel/property, address, room, handoff notes | Redact/tokenize before provider transmission unless the Owner explicitly allows a named field and purpose. |
| Message/media attachment, audio, image, document | Forbidden in W2-D; media understanding/transcription requires a separate story and policy gate. |
| Internal customer/conversation/lead/order/payment/provider IDs | Forbidden; use a one-request opaque correlation reference with no business meaning if technically required. |
| `A7 Ref`, click IDs, raw UTMs, CTWA IDs, attribution snapshot | Forbidden. |
| Payment Link, card/payment data, invoice/payment/refund payload | Forbidden. |

## Copilot output contract

The server accepts only a versioned structured result. Free-form provider text alone cannot drive UI fields or any
business action.

```text
copilot_result
├── detected_language            proposed + confidence/unknown
├── translated_excerpt           optional, visibly AI-generated
├── summary                      visibly AI-generated
├── explicit_facts[]             value + source excerpt reference + confidence/unknown
├── missing_information[]
├── contradictions[]
├── proposed_reply               visibly AI-generated and unapproved
├── safety_flags[]
└── policy/model versions        server-owned audit metadata
```

Rules:

1. Every extracted fact must cite a source excerpt already present in the approved minimized request.
2. Unsupported, ambiguous or contradictory values remain `unknown`/flagged; they never become inferred facts.
3. Confidence cannot authorize a business action and must not hide missing evidence.
4. The proposed reply cannot contain a price, deadline or availability promise unless that exact governed text was
   supplied by the server and the output labels it for human confirmation; final price remains forbidden.
5. Model output is validated against schema, output-size and policy limits and scanned for redacted-value leakage.
6. Invalid, unsafe, timed-out or unavailable output is discarded and shown as a visible copilot failure.
7. A human must review/correct the proposal. Only the existing W2-A approval boundary can freeze a customer-facing
   draft, and only the separately accepted W2-B boundary can send it.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Generate only translation, summary, explicit-fact extraction, missing/contradictory fields and a proposed reply from the approved minimized current context. | Blueprint §§6.4–6.7; Full Delivery Prompt W2-D |
| FR-02 | Return source references for extracted facts and preserve unknown/ambiguity instead of inference. | Blueprint NFR-04; attribution null semantics |
| FR-03 | Keep every AI field visibly proposed/unconfirmed until a human reviews it. | Blueprint human authority rule |
| FR-04 | Route any customer-facing proposal through the existing W2-A review/approval boundary; W2-D cannot create an approved draft directly. | A7-021 human-review boundary |
| FR-05 | W2-D cannot invoke W2-B or any transport; send remains a distinct explicit Owner action under A7-025. | A7-025 FR-01–03 and CON-01 |
| FR-06 | AI failure, timeout, rate limit, invalid schema, redaction failure or provider outage leaves the manual Atendimento/W2-A/W2-B workflow available and unchanged. | Measurement V2 and Blueprint fail-open behavior |
| FR-07 | The server selects the bounded conversation/context and PII policy; the browser cannot submit arbitrary transcript, system prompt, model, provider or policy. | Blueprint §16; protected-store boundary |
| FR-08 | Record a content-minimized append-only invocation audit: actor, UTC time, operation, policy/model version, safe request/result hashes, outcome, latency/error class and human disposition. | Blueprint NFR-02 and §16 |
| FR-09 | Prompt-injection text from the customer is treated as untrusted content and cannot change policy, access tools, disclose hidden context or widen the allowed fields. | No operational authority boundary |
| NFR-01 | Provider/model, region, retention, training, redaction, logs, deletion and PII allowlist are configuration governed by the approved Gate G0 record, not browser choices. | Blueprint §16 and §21.2 |
| NFR-02 | No secret or unapproved PII appears in URL, query string, analytics, `dataLayer`, Stripe metadata, diagnostic log, browser storage, error body or evidence artifact. | Attribution Contract §9; Measurement V2 privacy boundary |
| NFR-03 | Provider credentials stay server-only; private APIs are Owner-only initially, same-origin, method-restricted, submission-bound, rate-limited and fail closed on authorization. | Blueprint §16 |
| NFR-04 | CLI/service and synthetic adapter tests precede API/UI; UI contains no prompt, redaction, policy or authority logic. | AIOS Constitution I |
| NFR-05 | Requests use bounded input/output size, timeout, concurrency and cost controls; provider failure never retries into duplicate visible proposals without the same invocation identity. | Blueprint failure visibility/idempotency rules |
| NFR-06 | The provider adapter is replaceable only through a separately approved policy/model change; business flow does not depend on provider-specific output shape. | Gate G0 provider governance |
| CON-01 | No Production provider activation, secret creation or real PII test without separate exact Owner GO after local gates. | Full Delivery Prompt authorization matrix |
| CON-02 | No order, customer, lifecycle, custody, production, invoice, payment, refund, delivery, attribution, GA4 or Ads mutation. | Blueprint §§6.6, 15 and 22 |
| CON-03 | No autonomous send, automatic status message, marketing, campaign, upsell, discount, scheduling or customer portal. | A7-025 scope/non-goals; Blueprint §22 |
| CON-04 | No media transcription/vision, retrieval/vector store, long-term memory, customer scoring or model fine-tuning in this slice. | Lean scope and PII minimization |

## Acceptance criteria

- [ ] Gate G0 contains explicit Owner approvals and evidence for provider/model, region, retention, training,
  redaction, logs, deletion, PII allowlist, notice/consent basis and manual fallback.
- [ ] W2-A, W2-B and W2-C are accepted and stable before W2-D is enabled against real context.
- [ ] A local disabled/fake provider adapter exercises the full service contract with no network or credential.
- [ ] Translation preserves meaning and redaction placeholders across EN/PT/ES without restoring protected values.
- [ ] Summary and extracted facts contain only information explicitly present in the approved minimized source.
- [ ] Every extracted fact points to its source excerpt; missing, ambiguous and contradictory facts remain visible.
- [ ] A proposed reply is visibly AI-generated/unapproved and cannot become an approved W2-A draft without a separate
  explicit human review action.
- [ ] No code path from W2-D can call the W2-B send adapter, Graph API, WhatsApp Web or any external message transport.
- [ ] No AI response can create/qualify/accept/cancel an order, promise service/Express/timing, set a final price,
  apply discount, create invoice/link, charge/refund, mark delivery or change any state.
- [ ] Browser-supplied transcript, prompt, provider, model, PII policy, business facts, IDs and tool instructions are
  ignored/rejected; context and policy resolve server-side.
- [ ] Prompt-injection fixtures cannot reveal hidden instructions/context, widen the PII allowlist, trigger tools or
  convert customer text into system authority.
- [ ] Redaction tests prove forbidden PII, identifiers, attribution fields, payment data and secrets never reach the
  fake/provider request; response leak scanning rejects reintroduced values.
- [ ] Timeout, provider outage, rate limit, malformed JSON, schema violation and policy failure show a truthful error
  and preserve manual Atendimento, W2-A copy and W2-B reviewed-send operation.
- [ ] Exact invocation retry returns the prior safe result or a stable visible failure and does not create duplicate
  proposals/audit rows; conflicting idempotency reuse fails closed.
- [ ] Invocation audit is append-only and content-minimized; raw prompt, transcript, message body and full AI output do
  not enter diagnostic logs.
- [ ] Owner succeeds; unauthenticated requests return 401, non-Owner 403, and wrong-origin/method/submission identity
  fail closed.
- [ ] No customer, conversation, order, invoice, payment, refund, delivery, WhatsApp status, attribution, GA4 or Ads
  record changes during focused tests.
- [ ] Synthetic multilingual/privacy fixtures leave zero persisted customer or conversation residue.
- [ ] The private UI shows source facts, missing/contradictory fields, proposal state and one clear `Review` action at
  desktop and 390 px without adding a new dashboard or chat client.
- [ ] Focused adapter/service/API/UI tests, privacy and prompt-injection suite, lint, typecheck, full tests, build,
  secret scan and existing Orlando OS/WhatsApp regressions pass.
- [ ] Exact release artifact contains no unapproved provider SDK, model, region, secret, PII field, transport call or
  future-slice behavior.
- [ ] Production provider activation, secret/config mutation and first real-conversation probe each stop at their own
  separate exact Owner GO.

## Minimal operator flow

```text
Atendimento / conversation detail
→ PREPARE WITH AI
→ show translation + summary + explicit facts + gaps/contradictions
→ operator corrects or discards
→ prepare response proposal
→ REVIEW IN GOVERNED DRAFT
→ existing W2-A approval
→ existing W2-B reviewed send (only when separately eligible)
```

The operator can always skip `PREPARE WITH AI` and complete the same workflow manually.

## Tasks / Subtasks

- [ ] Close the blocking product/privacy decisions (AC: 1–2)
  - [ ] Record the exact Gate G0 decisions and evidence in this story or a linked approved policy artifact.
  - [ ] Prove W2-A/B/C are accepted and the manual fallback is operational.
  - [ ] Obtain architecture/privacy review before transmitting any real conversation or PII.
- [ ] Define the provider-neutral contract service-first (AC: 3–10, 13–14)
  - [ ] Define the bounded input, redaction placeholders, versioned output schema and safe error taxonomy.
  - [ ] Implement a disabled/fake adapter before any real provider adapter or SDK.
  - [ ] Keep provider, model, policy and context server-owned.
- [ ] Enforce privacy and no-authority boundaries (AC: 8–17)
  - [ ] Apply deterministic minimization/redaction before the adapter and response leak scanning after it.
  - [ ] Reject prompt injection, tool calls, unapproved fields and any response that could mutate or send.
  - [ ] Add content-minimized append-only audit, timeout/rate/cost limits and kill switch.
- [ ] Add minimal private operator presentation (AC: 7, 19)
  - [ ] Show AI-generated/unconfirmed labels, source references, gaps and contradictions.
  - [ ] Route accepted proposals to the existing W2-A human-review flow; retain manual entry/discard.
- [ ] Prove the slice without real PII first (AC: 3–22)
  - [ ] Use synthetic EN/PT/ES, prompt-injection, ambiguity, contradiction, redaction and provider-failure fixtures.
  - [ ] Prove no operational/external side effects and zero synthetic residue.
  - [ ] Run focused/full/privacy/security/visual gates and isolate the exact artifact.
  - [ ] Stop for separate Owner GOs before secrets, provider activation and first real-conversation probe.

## Dependencies and release gates

### G1 — Inbound and review foundations — BLOCKING

- W2-A is accepted in Production and its exact human approval boundary remains authoritative;
- W2-B is accepted/stable if official sending is enabled; W2-D must still work with W2-B kill-switched;
- W2-C deterministically links the protected conversation to the correct customer/lead/order context;
- manual Atendimento and reviewed drafting work without AI.

W2-D must not compensate for an uncertain conversation/customer/order join with fuzzy matching or model inference.

### G2 — Local privacy/security proof — BLOCKING

- fake adapter tests pass without provider network or credentials;
- PII minimization/redaction and post-response leak scan pass against adversarial fixtures;
- no-tool/no-mutation architecture and prompt-injection isolation are verified;
- safe audit/logging, idempotency, timeout, rate and cost behavior pass;
- real message/PII is not used for local or Preview convenience.

### G3 — Provider activation — SEPARATE EXACT GO

After G0–G2 pass, activation requires an exact Owner GO naming provider/model, account, environment, processing
region, approved PII fields, retention/training terms, secrets to create, kill switch, smoke and rollback. A generic
approval to “enable AI” is insufficient.

### G4 — First real-conversation probe — SEPARATE EXACT GO

After provider activation with synthetic data, one minimized real-conversation probe requires another exact Owner GO,
an identified consent/notice basis, minimum necessary fields, redacted evidence and immediate kill-switch rollback.
The probe cannot send a message or change business state.

### G5 — Production release

- exact immutable artifact and release-scope diff;
- additive/inert schema only if the approved design actually requires it;
- baseline deployment and application rollback identified;
- Owner-only authenticated smoke with synthetic data first;
- 390 px/desktop QA and full regression;
- no Stripe, Meta transport, WhatsApp Web, GA4, Ads, `/order` or attribution mutation;
- separate exact Production GO after every prior gate is evidenced.

## Rollback

1. The primary rollback is the server-side AI kill switch plus application rollback to the last accepted W2-C/W2-B
   artifact. Manual Atendimento, W2-A review/copy and W2-B reviewed send remain available.
2. Provider credentials/configuration are disabled or removed only under a separately approved secrets rollback;
   the story must document the provider-side data deletion action required by Gate G0.
3. Append-only, content-minimized audit evidence remains. Raw provider input/output is not retained merely to aid
   rollback.
4. Any additive AI-proposal schema remains inert under application rollback. Exceptional schema removal is allowed
   only when no retained real proposal/audit dependency exists and must never delete conversation/order history.
5. Rollback never edits a conversation, approved W2-A draft, WhatsApp send/status, customer, order, invoice, payment,
   attribution snapshot or analytics record.
6. Any privacy leak, unauthorized provider/model/region, unexpected retention/training behavior, authority bypass or
   manual-fallback regression triggers immediate kill switch and `NOT READY`; do not repair evidence or customer data
   silently.

## Explicit non-goals

- autonomous customer response, auto-send, scheduled send or automatic follow-up;
- autonomous qualification, booking, order acceptance/cancellation or operational state transition;
- final quote, final price, discount, negotiation, invoice, Payment Link, payment, refund or delivery decision;
- general-purpose chatbot, arbitrary chat composer, campaign, bulk send, marketing, upsell, loyalty or CRM automation;
- customer portal, app, account or AI-facing public endpoint;
- media transcription, OCR, image/audio/document analysis or attachment upload;
- vector database, retrieval platform, web browsing, long-term memory, customer profile learning or fine-tuning;
- fuzzy identity resolution, customer merge/reconciliation or attribution inference;
- model access to Supabase, Stripe, Meta, GA4, Google Ads, filesystem, shell or operational tools;
- provider/model auto-upgrade, fallback to an unapproved model/region or silent multi-provider routing;
- storing raw prompts, complete transcripts or model outputs in diagnostic logs;
- changing W2-A/B/C contracts, WhatsApp Coexistence, `/order`, Stripe, attribution, GA4 or Ads.

## Testing guidance

- Use synthetic multilingual fixtures with literal unsupported requests, ambiguity, contradictions and attempts to
  override instructions, request secrets, trigger tools or widen the PII allowlist.
- Assert exact redaction placeholders, no reversal/reconstruction and rejection of output containing canary PII.
- Assert every extracted field maps to an approved source excerpt and that absent facts remain unknown.
- Assert governed commercial language supplied by the server cannot be silently changed into a promise or final price.
- Simulate timeout, 429, 5xx, malformed/truncated output, schema mismatch, provider/model mismatch and region mismatch.
- Compare business tables and external adapter call counters before/after each invocation to prove no side effects.
- Verify logs, errors, traces, browser responses, static bundles and evidence artifacts contain only approved safe
  metadata.
- Render the actual private conversation/order context at 390 px and desktop, including disabled, loading, error,
  partial, review and discard states.
- Run repository-required `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, structure/agent validation
  and `git diff --check` when preparing an implementation gate.

## File List

- `docs/stories/a7-029-orlando-os-w2-d-ai-copilot.md`
