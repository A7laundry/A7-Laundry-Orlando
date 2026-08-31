# WhatsApp Orlando — Cloud API Bridge

## Boundary

This bridge is exclusively for **A7 Laundry Orlando** and the existing number
**+1 407-670-8839**. It uses Meta's official WhatsApp Cloud API in
**Coexistence** mode.

It must not use:

- Twilio or another transport that replaces Cloud API
- WhatsApp Web automation
- a new phone number
- a Brazil WABA, phone-number ID or Supabase project
- the classic number-registration flow that disconnects the Business app

The operational tenant is `orlando`. Durable data is stored in the
`A7xbusinessOS` Supabase project in North Virginia, not `A7X Os` in São Paulo.

## Confirmed Meta inventory (read-only audit, 2026-08-26)

Business portfolio: `a7laundry` (`1523774564935117`).

| WABA | ID | Phone inventory | Decision |
|---|---:|---|---|
| `a7laundry` | `1602826480815993` | `+1 321-667-4354` | Not Orlando's public number |
| `a7laundry` | `1485898246563738` | Empty | Not selected |
| `a7laundry` | `1938948490341347` | `+1 689-407-2015` | Not Orlando's public number |
| `A7 Laundry USA` | `960332550287200` | Empty | Candidate container; requires owner/Meta confirmation during Coexistence onboarding |
| Test account | `1413047626958118` | Meta test number | Never production |

No existing WABA currently contains `+1 407-670-8839`. The number must be
onboarded through the Coexistence-capable Embedded Signup flow. Do not infer a
WABA solely from its display name.

## System API

Production base URL:

```text
https://a7laundry.com/api/whatsapp
```

All system endpoints require:

```http
Authorization: Bearer <WHATSAPP_BRIDGE_TOKEN>
```

The bridge token is separate from `WHATSAPP_TOKEN`. A system client never
receives the Meta token or the Supabase service-role key.

### Health

```http
GET /api/whatsapp/health
```

### Unread queue

```http
GET /api/whatsapp/unread?limit=50
```

Returns conversations ordered by latest message, including `unread_count`,
`profile_name`, `wa_id`, preview and timestamps.

### Chat history

```http
GET /api/whatsapp/history?conversation_id=<uuid>&limit=100
GET /api/whatsapp/history?wa_id=14075550100&limit=100
```

Text and captions are inline. For received images/audio, request the
authenticated media endpoint using the returned `media_id`.

### Receive image/audio bytes

```http
GET /api/whatsapp/media?id=<media_id>
```

The bridge verifies that the media ID belongs to a stored Orlando message,
then streams the bytes from Meta. The Meta access token is never exposed.

### Send text

```http
POST /api/whatsapp/send
Content-Type: application/json
Authorization: Bearer <WHATSAPP_BRIDGE_TOKEN>

{
  "to": "14075550100",
  "text": "Your A7 Laundry pickup is confirmed."
}
```

Cloud API's customer-service window and template rules still apply. The bridge
returns the Meta `message_id` and persists the outbound message. In
Coexistence, an API-sent reply must also appear in the Business app thread.

### Clear local unread state

```http
POST /api/whatsapp/read
Content-Type: application/json
Authorization: Bearer <WHATSAPP_BRIDGE_TOKEN>

{
  "conversation_id": "<uuid>"
}
```

## Meta webhook

Callback URL:

```text
https://a7laundry.com/api/whatsapp/webhook
```

The verify token is the encrypted Vercel variable `WHATSAPP_VERIFY_TOKEN`.
Every POST must include a valid `X-Hub-Signature-256`, checked against the exact
raw request bytes using `WHATSAPP_APP_SECRET`.

Required subscriptions:

- `messages`
- `smb_message_echoes`
- `history`
- `smb_app_state_sync`
- `message_template_status_update`
- `account_update`

`smb_message_echoes` is what mirrors replies sent from the A7 phone into the
system history. `history` is the one-time backfill offered during Coexistence
onboarding. Historical messages do not increment the live unread queue.

## Encrypted production variables

```text
WHATSAPP_UNIT_KEY=orlando
WHATSAPP_GRAPH_API_VERSION
WHATSAPP_WABA_ID
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TOKEN
WHATSAPP_APP_SECRET
WHATSAPP_VERIFY_TOKEN
WHATSAPP_BRIDGE_TOKEN
WHATSAPP_SUPABASE_URL
WHATSAPP_SUPABASE_SERVICE_ROLE_KEY
```

Never place real values in Git, logs, screenshots or tickets.

## Go-live proof

The bridge is operational only after all five checks pass:

1. A personal number sends text, image and audio to `+1 407-670-8839`.
2. All three appear in `/unread` and `/history`; media downloads successfully.
3. The system sends a text reply through `/send`.
4. The guest receives the reply and the A7 Orlando phone displays the same
   outbound bubble in the existing chat.
5. A reply sent from the phone returns through `smb_message_echoes` and appears
   once in system history.

WhatsApp Web is only a manual reserve channel and is not part of the bridge.
