# Funnel Intelligence

Versioned source of truth for the A7 creative hypothesis funnel. It is intentionally separate from media-operation artifacts and contains no platform write client.

## CLI

```sh
node scripts/mos-funnel.mjs validate
node scripts/mos-funnel.mjs inventory
node scripts/mos-funnel.mjs lint-semantic
node scripts/mos-funnel.mjs compile
```

`compile` deterministically writes `mos-app/generated/funnel-intelligence.json`. The protected MOS build copies that artifact and the pure read-only contract. The dashboard reads it; it does not edit it.

## Evidence contract

Attention, click, session, call and conversation are distinct signals. `sale` requires a linked completed order. `retention` requires a linked repeat order. `PROMOTE` is an internal decision and requires a reconciled sale plus contribution; it never publishes or activates media.

Unknown values remain `null` and must carry `partial` or `unavailable`. Owner statements remain `owner_reported`.

The seed contains three traceable candidates. Only `guest wash-and-fold` is pilot-eligible. The 10×8 shape is capacity, not permission to invent seven more items or launch 80 assets.
