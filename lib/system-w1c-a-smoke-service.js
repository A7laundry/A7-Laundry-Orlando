'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function systemW1cASmokeService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());
  return {
    async run(actor, requestId = crypto.randomUUID()) {
      if (!actor || actor.role !== 'owner') throw new InvalidTransitionError('Owner authorization is required.');
      if (!UUID.test(String(requestId))) throw new InvalidTransitionError('Smoke request identity is invalid.');
      const result = await store.runW1cASmokeProbe({
        actor_id:actor.actor_id,
        actor_role:actor.role,
        request_id:requestId,
        occurred_at:now().toISOString()
      });
      const safe = {
        passed:Boolean(result?.passed),
        first_duplicate:Boolean(result?.first_duplicate),
        retry_duplicate:Boolean(result?.retry_duplicate),
        weight_event_count:Number(result?.weight_event_count),
        lifecycle_event_count:Number(result?.lifecycle_event_count),
        final_order_status:String(result?.final_order_status || ''),
        final_production_state:String(result?.final_production_state || ''),
        actual_lbs:Number(result?.actual_lbs),
        residue_count:Number(result?.residue_count)
      };
      if (!safe.passed || safe.first_duplicate || !safe.retry_duplicate
        || safe.weight_event_count !== 1 || safe.lifecycle_event_count !== 1
        || safe.final_order_status !== 'weighed' || safe.final_production_state !== 'awaiting_processing'
        || safe.actual_lbs !== 5 || safe.residue_count !== 0) {
        throw new InvalidTransitionError('W1C-A transactional smoke did not satisfy every gate.');
      }
      return safe;
    }
  };
}

module.exports = { systemW1cASmokeService };
