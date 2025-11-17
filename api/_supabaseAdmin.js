// /api/_supabaseAdmin.js
// Versión estable para Vercel utilizando import dinámico

let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Load supabase-js dynamically (Vercel compatible)
  const { createClient } = await import("@supabase/supabase-js");

  const url = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // IMPORTANTE: no lanzar errores aquí
  // Vercel carga process.env al momento de ejecutar la función.
  // Si tiras error antes, Vercel piensa que las variables no existen.
  if (!url || !serviceKey) {
    console.warn("⚠️ Supabase variables not ready yet.");
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
