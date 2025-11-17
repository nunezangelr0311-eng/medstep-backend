// /api/_supabaseAdmin.js
const { createClient } = require("@supabase/supabase-js");

// Log simple para ver en Vercel si las env existen
console.log("SUPABASE_URL present:", !!process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY present:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

module.exports = supabase;
