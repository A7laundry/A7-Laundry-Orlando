import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../sistema-team.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../supabase/migrations/20260901030000_orlando_os_team_access.sql', import.meta.url), 'utf8');
const managerMigration = fs.readFileSync(new URL('../supabase/migrations/20260901030001_orlando_os_manager_business_permissions.sql', import.meta.url), 'utf8');

test('Equipe is Owner-only and Manager business navigation is explicit', () => {
  assert.match(html, /id="teamNav" class="owner-only"/);
  assert.match(html, /id="financeNav" class="manager-access"/);
  assert.match(html, /Gestora.*Operação, clientes, hotéis, invoices e financeiro/s);
  assert.match(app, /user\.role !== 'owner'/);
  assert.match(ui, /role !== 'owner'/);
});

test('temporary password is one-time UI state with mandatory change', () => {
  assert.match(html, /SENHA TEMPORÁRIA · EXIBIDA UMA VEZ/);
  assert.match(html, /id="passwordChangeView"/);
  assert.match(app, /user\.must_change_password/);
  assert.match(ui, /temporaryPasswordValue.*textContent = ''/s);
  assert.doesNotMatch(ui, /localStorage|sessionStorage/);
  assert.match(migration, /must_change_password boolean not null default true/);
  assert.doesNotMatch(migration, /password[^\n]* text[^\n]*default/i);
});

test('Manager compatibility retains truthful role in business audit tables', () => {
  for (const table of [
    'a7_orlando_operator_audit', 'a7_orlando_operational_events',
    'a7_orlando_item_weight_events', 'a7_orlando_invoice_events',
    'a7_orlando_hotel_events'
  ]) assert.match(managerMigration, new RegExp(`alter table public\\.${table}`));
  assert.doesNotMatch(managerMigration, /alter table public\.a7_orlando_(?:manual_order_requests|order_message_events)/,
    'the cutover must not alter a missing W2 table or a table without actor_role');
  assert.match(managerMigration, /p_actor_role not in \(''owner'', ''manager''\)/);
  assert.doesNotMatch(managerMigration, /a7_orlando_(?:w2_a|create_known_customer_order)/,
    'the Manager cutover must not depend on unapplied W2/W3 migrations');
  assert.doesNotMatch(managerMigration, /Stripe|Google Ads|attribution snapshot/i);
});
