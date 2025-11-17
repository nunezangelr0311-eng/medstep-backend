// /api/_supabaseAdmin.js
// Versión para CommonJS usando import dinámico (ESM inside CJS)

let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Carga ESM de forma dinámica
  const { createClient } = await import("@supabase/supabase-js");

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing Supabase environment variables.",
      "SUPABASE_URL:", !!url,
      "SUPABASE_SERVICE_ROLE_KEY:", !!serviceKey
    );
    throw new Error("Missing Supabase environment variables.");
  }

  supabaseClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

module.exports = getSupabaseClient;
