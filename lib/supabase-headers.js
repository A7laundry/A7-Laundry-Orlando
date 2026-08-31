'use strict';

function supabaseHeaders(key) {
  const value = String(key || '').trim();
  const headers = { apikey: value };
  // Supabase's new sb_secret_ credentials authenticate through apikey only.
  // Legacy service_role JWTs retain Bearer compatibility during migration.
  if (value && !value.startsWith('sb_secret_')) headers.Authorization = `Bearer ${value}`;
  return headers;
}

module.exports = { supabaseHeaders };
