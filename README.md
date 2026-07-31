# A7 Laundry Orlando

Guest laundry pickup & delivery for hotels, resorts and Airbnbs — per-pound wash & fold in Orlando, FL.

**Deploy:** https://a7laundry.com — via Vercel

> Definição canônica do projeto: ver [MANIFESTO.md](MANIFESTO.md).

---

## Pages

| Page | Description | URL |
|------|-------------|-----|
| **Home (Hub)** | Guest laundry — Normal 24h / Express 6h subject to availability | [/](https://a7laundry.com/) |
| **Guest Laundry** | Conversion page for hotel, resort and Airbnb pickup | [/laundry-pickup-delivery-orlando](https://a7laundry.com/laundry-pickup-delivery-orlando) |
| Pricing | Per-lb pricing + weight estimator | [/plans](https://a7laundry.com/plans) |
| Carpet Cleaning | LP — carpet cleaning service | [/carpet](https://a7laundry.com/carpet) |
| Shoe Cleaning | LP — sneaker/shoe restoration | [/shoes](https://a7laundry.com/shoes) |
| Upholstery Cleaning | LP — upholstery deep clean | [/upholstery](https://a7laundry.com/upholstery) |
| Vacation Rental | LP — turnover cleaning for hosts | [/vacation](https://a7laundry.com/vacation) |
| Comforter | Secondary service page — paid campaign paused | [/comforter](https://a7laundry.com/comforter) |
| Blog | SEO blog — 84 published articles; new-page production frozen pending indexation review | [/blog](https://a7laundry.com/blog) |

---

## Pricing (per-pound)

Pay-per-use por libra — **sem assinatura, sem contrato**. Pickup & delivery sempre grátis.

| Service | Turnaround | Price |
|---------|-----------|-------|
| **Normal** | 24h | **$3.25 / lb** |
| **Express** | 6h (same-day, subject to availability) | **$3.95 / lb** |

Minimum order: $50. Booking via WhatsApp **(407) 670-8839**.

Operating rules: customer contact is declared **24/7**; Express requests are accepted until
**6 PM** and remain subject to unit availability; later requests are evaluated case by case.
Service addresses are confirmed within a radius of up to **40 km from Orlando**. Custom services
normally target 48h, but price, turnaround and capacity always require final unit confirmation.
B2B pricing may start at **$1.95/lb**, depending on volume, frequency, scope and capacity.

**Specialty add-ons:** carpet, shoe, upholstery, comforter & vacation-rental turnover cleaning,
all subject to final scope, turnaround and capacity confirmation.

---

## Stack

- Static HTML/CSS/JS (no framework, no build)
- Deploy: Vercel (`vercel.json` — clean URLs + security/cache headers)
- Tracking: GTM (`GTM-KV9LGVRN`) + GA4 (`G-JLQNRC7MK4`) + Meta Pixel + dataLayer + `a7-tracking.js`
- Languages: EN by default; PT-BR / ES only on dedicated multilingual pages and targeted campaigns
- Repo: [A7laundry/A7-Laundry-Orlando](https://github.com/A7laundry/A7-Laundry-Orlando)
