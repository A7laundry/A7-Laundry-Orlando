'use strict';

const ACTIVE_ROLES = Object.freeze(['owner', 'manager', 'operator']);
const ROLE_SET = new Set(ACTIVE_ROLES);

const CAPABILITIES = Object.freeze({
  SYSTEM_READ: 'system.read',
  ORDER_CREATE: 'order.create',
  OPERATION_MANAGE: 'operation.manage',
  OPERATION_MARK_READY: 'operation.mark_ready',
  CUSTOMER_MANAGE: 'customer.manage',
  HOTEL_MANAGE: 'hotel.manage',
  FINANCE_READ: 'finance.read',
  INVOICE_MANAGE: 'invoice.manage',
  PAYMENT_MANAGE: 'payment.manage',
  MESSAGE_MANAGE: 'message.manage',
  TEAM_MANAGE: 'team.manage',
  SECURITY_MANAGE: 'security.manage',
  INTERNAL_SMOKE: 'internal_smoke.run'
});

const MATRIX = Object.freeze({
  owner: new Set(Object.values(CAPABILITIES)),
  manager: new Set([
    CAPABILITIES.SYSTEM_READ,
    CAPABILITIES.ORDER_CREATE,
    CAPABILITIES.OPERATION_MANAGE,
    CAPABILITIES.OPERATION_MARK_READY,
    CAPABILITIES.CUSTOMER_MANAGE,
    CAPABILITIES.HOTEL_MANAGE,
    CAPABILITIES.FINANCE_READ,
    CAPABILITIES.INVOICE_MANAGE,
    CAPABILITIES.PAYMENT_MANAGE,
    CAPABILITIES.MESSAGE_MANAGE
  ]),
  operator: new Set([
    CAPABILITIES.SYSTEM_READ,
    CAPABILITIES.ORDER_CREATE,
    CAPABILITIES.OPERATION_MARK_READY
  ])
});

function validRole(role) {
  return ROLE_SET.has(String(role || '').trim().toLowerCase());
}

function can(roleOrActor, capability) {
  const role = typeof roleOrActor === 'string' ? roleOrActor : roleOrActor?.role;
  return validRole(role) && Boolean(MATRIX[role]?.has(capability));
}

function rolesFor(capability) {
  return ACTIVE_ROLES.filter((role) => can(role, capability));
}

module.exports = { ACTIVE_ROLES, ROLE_SET, CAPABILITIES, MATRIX, validRole, can, rolesFor };
