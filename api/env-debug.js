// api/env-debug.js

module.exports = async (req, res) => {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return res.status(200).json({
      hasSupabaseUrl: !!url,
      supabaseUrlPrefix: url ? url.substring(0, 40) : null, // solo para verificar que es la URL correcta
      hasServiceRoleKey: !!serviceKey,
      serviceRoleKeyLength: serviceKey ? serviceKey.length : 0
    });
  } catch (err) {
    console.error("env-debug error:", err);
    return res.status(500).json({ error: "env_debug_failed", detail: err.message });
  }
};
