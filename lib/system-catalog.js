'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { InvalidTransitionError } = require('./operational-store.js');

const catalogPath = path.join(__dirname, '..', 'config', 'orlando-service-catalog.json');

function loadCatalog() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  if (!Number.isInteger(catalog.version) || catalog.version < 1 || catalog.currency !== 'USD') {
    throw new Error('Invalid Orlando service catalog.');
  }
  const codes = new Set();
  for (const service of catalog.services || []) {
    if (!service.code || codes.has(service.code) || !service.label || !service.unit) {
      throw new Error('Invalid Orlando service catalog entry.');
    }
    codes.add(service.code);
  }
  return Object.freeze(catalog);
}

const CATALOG = loadCatalog();

function publicCatalog() {
  return {
    version: CATALOG.version,
    currency: CATALOG.currency,
    services: CATALOG.services.filter((service) => service.active).map((service) => ({
      code: service.code,
      service_type: service.service_type,
      tier: service.tier,
      label: service.label,
      unit: service.unit,
      unit_price: service.unit_price,
      minimum_amount: service.minimum_amount,
      requires_manual_review: service.requires_manual_review,
      rule: service.rule || null
    }))
  };
}

function resolveItems(items, tier) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 12) {
    throw new InvalidTransitionError('At least one valid order item is required.');
  }
  const byCode = new Map(CATALOG.services.filter((row) => row.active).map((row) => [row.code, row]));
  return items.map((input) => {
    let code = String(input?.code || '').trim();
    if (code === 'wash_fold') code = tier === 'express' ? 'wash_fold_express' : 'wash_fold_normal';
    const service = byCode.get(code);
    if (!service) throw new InvalidTransitionError('Unsupported service catalog item.');
    if (service.tier && service.tier !== tier) throw new InvalidTransitionError('Service tier does not match the catalog item.');
    const quantity = input.quantity == null || input.quantity === '' ? null : Number(input.quantity);
    const estimatedWeight = input.estimated_lbs == null || input.estimated_lbs === ''
      ? null : Number(input.estimated_lbs);
    if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100)) {
      throw new InvalidTransitionError('Item quantity is invalid.');
    }
    if (estimatedWeight !== null && (!Number.isFinite(estimatedWeight) || estimatedWeight <= 0 || estimatedWeight > 500)) {
      throw new InvalidTransitionError('Estimated item weight is invalid.');
    }
    if (service.unit === 'unit' && quantity === null) throw new InvalidTransitionError('Item quantity is required.');
    return {
      catalog_code: service.code,
      service_type: service.service_type,
      label: service.label,
      unit: service.unit,
      quantity,
      estimated_lbs: service.unit === 'lb' ? estimatedWeight : null,
      unit_price: service.unit_price,
      minimum_amount: service.minimum_amount,
      currency: CATALOG.currency,
      requires_manual_review: service.requires_manual_review,
      notes: String(input.notes || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500) || null,
      catalog_version: CATALOG.version
    };
  });
}

module.exports = { CATALOG, loadCatalog, publicCatalog, resolveItems };
