#!/usr/bin/env bash
set -euo pipefail

container="${A7_W3D_CONTAINER:-supabase_db_a7_orlando_recovery_replay}"
database="${A7_W3D_DATABASE:-a7_w3d_concurrency_20260902}"

case "$database" in
  a7_w3d_*) ;;
  *) echo "Refusing non-disposable database: $database" >&2; exit 2 ;;
esac

docker exec "$container" psql -U postgres -d "$database" -v ON_ERROR_STOP=1 \
  -f /tmp/test-system-routes-concurrency.sql

docker exec "$container" psql -U postgres -d "$database" -v ON_ERROR_STOP=1 -Atc \
  "select public.a7_w3d_concurrency_attempt('owner-concurrency','owner','route-concurrency:pickup-owner');" &
owner_pid=$!
docker exec "$container" psql -U postgres -d "$database" -v ON_ERROR_STOP=1 -Atc \
  "select public.a7_w3d_concurrency_attempt('manager-concurrency','manager','route-concurrency:pickup-manager');" &
manager_pid=$!

wait "$owner_pid"
wait "$manager_pid"

docker exec "$container" psql -U postgres -d "$database" -v ON_ERROR_STOP=1 \
  -f /tmp/test-system-routes-concurrency-verify.sql
