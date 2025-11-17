// /api/_supabaseAdmin.js
const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing Supabase environment variables:", {
      SUPABASE_URL: url,
      SUPABASE_SERVICE_ROLE_KEY: serviceKey
    });
    throw new Error("Missing Supabase environment variables.");
  }

  supabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}

module.exports = getSupabaseClient;
