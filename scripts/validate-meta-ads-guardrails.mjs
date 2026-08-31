import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const official = '14076708839';
const blockedTest = '15556287241';

const policy = read('marketing/meta-ads/publishing-guardrails.yaml');
const account = read('marketing/meta-ads/account.yaml');
const operator = read('marketing/meta-ads/a7-meta-ads-operator.md');
const creativeStandard = read('marketing/meta-ads/creative-production-standard.md');
const mosSnapshot = read('mos-kpis.js');

assert.match(policy, /official_e164:\s*"\+14076708839"/, 'Meta policy must pin the official WhatsApp number');
assert.match(policy, /blocked_test_e164:\s*"\+15556287241"/, 'Meta policy must block the Meta test number');
assert.match(policy, /fail_when_destination_unverified:\s*true/, 'Meta publication must fail when the destination is unverified');
assert.match(policy, /official_instagram_handle:\s*"@a7laundry"/, 'Meta policy must pin the Orlando Instagram handle');
assert.match(policy, /paid_service_area:\s*"Orlando area"/, 'Meta policy must pin the supported paid service area');
assert.match(policy, /forbid_cross_brand_handles:\s*true/, 'Meta policy must reject cross-brand social handles');
assert.match(policy, /require_placement_preview_attestation:\s*true/, 'Placement preview attestation must be mandatory');
assert.match(policy, /critical_content_safe_zone_y:\s*"420-1500"/, 'Universal creative safe zone must remain pinned');

assert.match(account, /number_real:\s*"\+1 407-670-8839"/, 'Account source of truth must identify the official WhatsApp number');
assert.match(account, /test_number_do_not_use:\s*"\+1 555-628-7241"/, 'Account source of truth must keep the test number explicitly blocked');
assert.match(operator, /número correto/i, 'Operator preflight must verify the WhatsApp number');
assert.match(operator, /preview|prévia/i, 'Operator preflight must verify placement previews');
assert.match(creativeStandard, /y 420 a 1500/i, 'Creative standard must preserve the universal safe zone');
assert.match(creativeStandard, /prévia.*placement|placement.*prévia/i, 'Creative standard must require real placement previews');

const operationalYaml = [
  'marketing/meta-ads/templates/campaign-template.yaml',
  ...fs.readdirSync(path.join(root, 'marketing/meta-ads/campaigns'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `marketing/meta-ads/campaigns/${entry.name}/campaign-spec.yaml`)
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
];

for (const relativePath of operationalYaml) {
  const source = read(relativePath);
  assert.equal(
    normalizePhone(source).includes(blockedTest),
    false,
    `${relativePath} must never contain the Meta test number`
  );
  const whatsappMatch = source.match(/^\s*whatsapp:\s*["']?([^"'\n#]+)["']?/m);
  if (whatsappMatch) {
    assert.equal(
      normalizePhone(whatsappMatch[1]),
      official,
      `${relativePath} must use the official WhatsApp number`
    );
  }
}

assert.match(mosSnapshot, /officialWhatsapp:\s*'\+1 407-670-8839'/, 'MOS fallback must expose the official WhatsApp destination');
assert.match(mosSnapshot, /destinationGuard:\s*'BLOCKED_TEST_DESTINATION'/, 'MOS fallback must preserve the current critical destination block');
assert.doesNotMatch(mosSnapshot, /\+1 555-628-7241/, 'MOS browser data must not expose or normalize the test number as an allowed destination');

console.log(`Meta Ads guardrails validated for ${operationalYaml.length} operational YAML files.`);
