// ✅ MedStep Save-State endpoint (Vercel Node, Supabase, ACTIONS_SECRET, CORS)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  // 🌐 CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*"); // luego cámbialo a tu dominio
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.ACTIONS_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !secret) {
      console.error("Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasSecret: !!secret,
      });
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing environment variables" });
    }

    // 🔐 Bearer token
    const rawAuth =
      (req.headers.authorization || req.headers.Authorization || "") + "";
    const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

    if (!token || token !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 📥 Body JSON
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    body = body || {};

    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return res
        .status(400)
        .json({ error: "Missing required fields" });
    }

    // 🔗 Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 💾 Upsert en progress_state
    const { data, error } = await supabase
      .from("progress_state")
      .upsert([
        {
          student_id,
          nbme_input,
          plan_output,
          fatigue_level,
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ state saved", data);

    return res.status(200).json({
      success: true,
      message: "state saved",
      data,
    });
  } catch (err) {
    console.error("Handler error:", err);
    return res
      .status(500)
      .json({ error: err && err.message ? err.message : "Internal Server Error" });
  }
};
