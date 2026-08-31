# A7 Measurement V2 — Phase 0 + Phase 1 Foundation

## Current Tracking

`a7-tracking.js` remains the only production interaction listener. It continues to initialize GA4, Google Ads and Meta, configure the existing website-call action and send exactly the existing WhatsApp conversion destination. Stripe conversion code is outside this phase and is unchanged.

The public build injects `a7-business-config.js`, `a7-attribution.js` and `a7-events.js` immediately before the unified tracking script. If any foundation module fails, the tracking script retains its official-number fallback and never prevents CTA navigation.

## Attribution V2

The contract captures GCLID, GBRAID, WBRAID, UTMs, external referrer host, landing path and timestamp. Click IDs remain in the shadow attribution record and are reduced to boolean presence in diagnostics/API responses. They are not copied into GA4 event parameters.

First touch is immutable. The first visit can be direct, campaign or external referral. Last touch changes only for a new campaign-bearing entry or a new external referrer. Internal A7 navigation and later direct visits do not overwrite it.

`attribution_id` contains 128 cryptographically random bits. `short_ref` contains 50 random bits represented by ten case-insensitive characters from a 32-character alphabet that omits `0`, `1`, `I` and `O`. At one million generated references, the birthday-bound collision probability is approximately 0.044%; the future durable adapter must also enforce a unique index and retry on collision.

Static HTML still contains the original WhatsApp URLs to keep no-JavaScript and failure behavior intact. The centralized builder normalizes them at runtime and again at click time, which also repairs estimator CTAs that rewrite their own `href`. The CLI destination guard protects all remaining static occurrences.

## A7 Ref V2

The only customer-visible attribution value is:

```text
A7 Ref: 7KQ9W3M2HX
```

It contains no campaign, click ID or PII. `a7-business-config.js` owns WhatsApp URL construction. It removes an existing legacy/V2 suffix, encodes the message, appends a valid short reference when available and always targets `14076708839`.

## Failure Behavior

- Attribution API unavailable: the existing WhatsApp URL remains usable; a reference may be absent.
- GA4/Google tag exception: the click listener does not cancel navigation.
- Meta exception: navigation continues.
- Missing foundation module: unified tracking uses the official-number fallback.
- Repeated tracking script: a global initialization guard prevents a second listener.
- Separate user double-clicks remain separate legitimate interactions.

## Privacy Boundaries

There is no CMP decision in this story. No new persistent attribution cookie is set while consent is unknown. The API sets an HttpOnly, Secure, SameSite=Lax cookie containing only `attribution_id` when an external consent interface explicitly reports `attribution_storage=granted`.

Shadow diagnostics are available only on localhost/127.0.0.1 or when an authorized runtime sets `window.__A7_DEBUG_AUTHORIZED__ = true` before tracking loads. Diagnostics mask attribution IDs and never include click-ID values, message text, customer phone, email or address.

The default API storage adapter is process memory, reports `shadow_ephemeral` and is not durable or official. The browser session cache is a continuity aid, not a source of truth. A later story must provide a durable adapter implementing `get(id)`, `getByShortRef(ref)` and `save(record)` with encryption, unique constraints, retention and access controls.

## Testing

- `npm run guard:business`
- `npm run inventory:ctas`
- `node scripts/test-attribution-v2.mjs`
- `node scripts/test-tracking.mjs`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Rollback

Revert the foundation module injection and restore the prior `a7-tracking.js`. No database migration or external platform setting must be reversed. Static WhatsApp links continue targeting the official number throughout rollback.

## Future Integration Points

- Replace `MemoryAttributionStore` with durable server storage.
- Add a CMP-approved consent adapter.
- Add WhatsApp Business Platform/webhook matching.
- Add CRM lead states and offline conversions.
- Add Stripe webhook authority in its own story.

None of those later phases is implemented here.
