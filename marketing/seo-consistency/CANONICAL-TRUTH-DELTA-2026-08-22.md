# Canonical truth delta — guest laundry

**Date:** 2026-08-22  
**Status:** conflict identified; implementation gate for `/plans`.  
**Purpose:** reconcile the project-declared source of truth with the later paid-offer contract and the
three owner-approved live funnels before changing cross-site copy or schema.

## Conflict

`MANIFESTO.md` declares that it prevails over older pages, but its guest-offer language no longer
matches the later canonical paid-offer document or the approved live funnels.

| Field | `MANIFESTO.md` | Later/current live contract | Recommended lock |
|---|---|---|---|
| Base service name | `Normal` | `Standard` | **Standard** |
| Base turnaround | `24h` | approximate 24-hour return | **Approx. 24h** |
| Express turnaround | `8h` | up to 8h only when availability, capacity and window are confirmed | **Up to 8h when confirmed** |
| Pickup/delivery | always free | included only in confirmed service area | **Included in confirmed area** |
| Minimum | US$50; stated as ~17 lb | US$50 value minimum | **US$50; do not translate to a fixed load** |
| Coverage | named cities / 40 km | address and area confirmed before pickup | **Confirm location/address first** |
| Availability | requests 24/7 | pickup/return never automatic | **Requests anytime; service window confirmed** |
| Booking | WhatsApp-first | WhatsApp and SMS are current primary contact paths | **WhatsApp primary; SMS supported** |
| Payment | not fully modeled | final total after weighing; secure USD Stripe-hosted link plus approved alternatives | **Use current payment contract** |
| Proof | 5.0/23 while verified | current count unavailable | **Do not emit rating/count until reverified** |
| Social entity | canonical brand A7 Laundry | `@a7laundry` on Instagram/Facebook | **Use current A7 Laundry profiles** |

## Arithmetic correction

- US$50 / US$3.25 = 15.38 lb.
- A public statement of “about 15 lb” is a rough illustration, not a fixed included weight.
- A 25 lb Standard order at US$3.25/lb is **US$81.25**, not US$72.50.
- Express at 25 lb is US$98.75.
- Every estimate remains subject to final weight and service confirmation; the minimum is a value
  floor, not a promise of a particular bag size.

## Recommended canonical guest-laundry contract

1. **Service:** guest wash, dry and fold pickup/delivery for eligible everyday machine-washable
   clothing.
2. **Standard:** from US$3.25/lb; approximate 24-hour return.
3. **Express:** from US$3.95/lb; up to 8 hours only after availability, capacity, pickup and return
   window are confirmed.
4. **Minimum:** US$50 per guest wash-and-fold order.
5. **Pickup/delivery:** included only in the confirmed service area.
6. **Handoff:** front desk/Bell Services only when property rules permit; otherwise coordinate another
   point.
7. **Coverage:** send hotel/address first; do not infer blanket coverage from a city/landmark list.
8. **Intake:** stay/address, needed-by time, approximate load and Standard/Express preference.
9. **Contact:** WhatsApp `+1 407-670-8839`; SMS supported where the page contract includes it.
10. **Payment:** final total confirmed after weighing; secure USD Stripe-hosted payment link is
    available; alternative methods are communicated without requesting card details in WhatsApp/SMS.
11. **Proof:** public profile/activity can be linked; ratings, counts, reviews and operational photos
    must be current and sourced.
12. **Brands:** no hotel, platform or attraction partnership is implied.

## Required governance action

Before `/plans` publication, update or formally supersede the conflicting guest-offer sections of
`MANIFESTO.md` so that validators and future contributors do not reintroduce `Normal`, absolute timing,
blanket coverage or stale rating claims. The update must preserve separate rules for item-priced,
custom and B2B services.

## Resolution status — 2026-08-22

The project owner authorized execution of the consistency program. The recommended contract above
has therefore been incorporated into `MANIFESTO.md`, the local `/plans` candidate and the repository
validation gate. This delta remains the dated audit trail explaining why the source-of-truth change
was required. Production publication of the `/plans` candidate still requires the independent QA,
protected-preview and exact-promotion gates recorded in A7-003.
