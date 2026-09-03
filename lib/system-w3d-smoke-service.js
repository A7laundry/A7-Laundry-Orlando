'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function systemW3dSmokeService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  return {
    async run(actor, requestId = crypto.randomUUID()) {
      if (!actor || actor.role !== 'owner') {
        throw new InvalidTransitionError('Owner authorization is required.');
      }
      if (!UUID.test(String(requestId))) {
        throw new InvalidTransitionError('Smoke request identity is invalid.');
      }
      const result = await store.runW3dSmokeProbe({
        actor_id:actor.actor_id,
        actor_role:actor.role,
        request_id:requestId
      });
      const safe = {
        passed:Boolean(result?.passed),
        create_retry_duplicate:Boolean(result?.create_retry_duplicate),
        pickup_retry_duplicate:Boolean(result?.pickup_retry_duplicate),
        route_completed:Boolean(result?.route_completed),
        pickup_event_count:Number(result?.pickup_event_count),
        delivery_completed:Boolean(result?.delivery_completed),
        bell_desk_intermediate:Boolean(result?.bell_desk_intermediate),
        exception_preserved_order:Boolean(result?.exception_preserved_order),
        exception_requeued:Boolean(result?.exception_requeued),
        residue_count:Number(result?.residue_count)
      };
      if (!safe.passed || !safe.create_retry_duplicate || !safe.pickup_retry_duplicate
        || !safe.route_completed || safe.pickup_event_count !== 1
        || !safe.delivery_completed || !safe.bell_desk_intermediate
        || !safe.exception_preserved_order || !safe.exception_requeued
        || safe.residue_count !== 0) {
        throw new InvalidTransitionError('W3-D transactional smoke did not satisfy every gate.');
      }
      return safe;
    }
  };
}

module.exports = { systemW3dSmokeService };
