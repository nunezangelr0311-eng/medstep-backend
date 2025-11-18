export default function handler(req, res) {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : null,
    ACTIONS_SECRET: process.env.ACTIONS_SECRET ? 'OK' : null
  });
}
