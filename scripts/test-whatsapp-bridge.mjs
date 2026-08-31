import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import bridge from '../lib/whatsapp-bridge.js';

test('validates Meta signature against the exact raw bytes', () => {
  const raw = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = 'test-secret';
  const signature = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  assert.equal(bridge.verifyWebhookSignature(raw, signature, secret), true);
  assert.equal(bridge.verifyWebhookSignature(Buffer.from('{}'), signature, secret), false);
  assert.equal(bridge.verifyWebhookSignature(raw, null, secret), false);
});

test('normalizes inbound text and image without dropping media', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ id: 'waba-orlando', changes: [{ field: 'messages', value: {
      metadata: { phone_number_id: 'phone-orlando' },
      contacts: [{ wa_id: '14075550100', profile: { name: 'Guest' } }],
      messages: [
        { id: 'wamid.text', from: '14075550100', timestamp: '1787790000', type: 'text', text: { body: 'Hello' } },
        { id: 'wamid.image', from: '14075550100', timestamp: '1787790001', type: 'image', image: {
          id: 'media12345', mime_type: 'image/jpeg', sha256: 'hash', caption: 'My laundry'
        } }
      ]
    } }] }]
  };
  const result = bridge.normalizeWebhook(payload, { unitKey: 'orlando' });
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].text_body, 'Hello');
  assert.equal(result.messages[0].profile_name, 'Guest');
  assert.equal(result.messages[1].message_type, 'image');
  assert.equal(result.messages[1].media_id, 'media12345');
  assert.equal(result.messages[1].caption, 'My laundry');
});

test('normalizes audio and keeps its downloadable media id', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: {
      metadata: { phone_number_id: 'phone-orlando' },
      messages: [{ id: 'wamid.audio', from: '14075550101', type: 'audio', timestamp: '1787790002', audio: {
        id: 'audio12345', mime_type: 'audio/ogg; codecs=opus', sha256: 'audio-hash'
      } }]
    } }] }]
  };
  const [message] = bridge.normalizeWebhook(payload).messages;
  assert.equal(message.message_type, 'audio');
  assert.equal(message.media_id, 'audio12345');
  assert.equal(message.media_mime_type, 'audio/ogg; codecs=opus');
});

test('normalizes Business App echoes as outbound messages to the customer', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'smb_message_echoes', value: {
      metadata: { phone_number_id: 'phone-orlando' },
      message_echoes: [{
        id: 'wamid.echo', from: '14076708839', to: '14075550102', timestamp: '1787790003',
        type: 'text', text: { body: 'Reply from the A7 phone' }
      }]
    } }] }]
  };
  const [message] = bridge.normalizeWebhook(payload).messages;
  assert.equal(message.direction, 'outbound');
  assert.equal(message.source, 'business_app');
  assert.equal(message.wa_id, '14075550102');
});

test('normalizes shared Coexistence history without adding it to the live unread queue', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'history', value: {
      metadata: { phone_number_id: 'phone-orlando', display_phone_number: '14076708839' },
      history: [{ threads: [{ id: '14075550103', name: 'Past Guest', messages: [{
        id: 'wamid.history', from: '14075550103', timestamp: '1787700000',
        type: 'text', text: { body: 'Past message' }, history_context: { status: 'read' }
      }] }] }]
    } }] }]
  };
  const [message] = bridge.normalizeWebhook(payload).messages;
  assert.equal(message.wa_id, '14075550103');
  assert.equal(message.source, 'history_sync');
  assert.equal(message.is_historical, true);
  assert.equal(message.status, 'read');
});

test('normalizes status updates and rejects invalid API input', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: {
      statuses: [{ id: 'wamid.sent', status: 'delivered', timestamp: '1787790004' }]
    } }] }]
  };
  assert.equal(bridge.normalizeWebhook(payload).statuses[0].status, 'delivered');
  assert.throws(() => bridge.cleanPhone('not-a-phone'), /Invalid WhatsApp recipient/);
  assert.throws(() => bridge.cleanText('   '), /Text must contain/);
});

test('bridge API token comparison is timing-safe and exact', () => {
  assert.equal(bridge.safeEqual('orlando-token', 'orlando-token'), true);
  assert.equal(bridge.safeEqual('orlando-token', 'brazil-token'), false);
  assert.equal(bridge.safeEqual('', ''), false);
});

test('Supabase secret keys use apikey only while legacy JWTs retain Bearer compatibility', () => {
  assert.deepEqual(bridge.supabaseHeaders('sb_secret_example'), {apikey: 'sb_secret_example'});
  assert.deepEqual(bridge.supabaseHeaders('legacy-jwt'), {
    apikey: 'legacy-jwt', Authorization: 'Bearer legacy-jwt'
  });
});
