// ✅ MedStep Save-State endpoint
// Guarda/actualiza el estado de estudio de un estudiante.
// Basado en:
// - students(id uuid PK, ...)
// - progress_state(student_id uuid FK -> students.id, nbme_input jsonb, plan_output jsonb, fatigue_level int, updated_at timestamptz)

const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  // 🌐 CORS básico (permitimos desde cualquier origen por ahora)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Variables necesarias
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.ACTIONS_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !secret) {
      console.error("Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasSecret: !!secret
      });
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing environment variables" });
    }

    // 🔐 Bearer token: ACTIONS_SECRET
    const rawAuth =
      (req.headers.authorization || req.headers.Authorization || "") + "";
    const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

    if (!token || token !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 📥 Parse body
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    body = body || {};

    // 👇 Contrato claro del endpoint
    // preferimos "student_id" = uuid exacto que existe en students.id
    const student_id =
      body.student_id || body.student_uuid || body.student || null;
    const nbme_input = body.nbme_input || body.nbme || null;
    const plan_output = body.plan_output || body.plan || null;
    const fatigue_level =
      typeof body.fatigue_level === "number"
        ? body.fatigue_level
        : body.fatigue ?? null;

    if (!student_id || !nbme_input || !plan_output) {
      return res.status(400).json({
        error:
          "Missing required fields: student_id, nbme_input, plan_output are required"
      });
    }

    // 🔗 Cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ Verificar que el estudiante existe (respeta fk_student)
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", student_id)
      .maybeSingle();

    if (studentError) {
      console.error("Error checking student:", studentError);
      return res.status(500).json({ error: studentError.message });
    }

    if (!student) {
      return res.status(400).json({
        error:
          "Student not found for given student_id. Ensure it exists in 'students' table."
      });
    }

    // 💾 Upsert en progress_state
    const { data, error } = await supabase
      .from("progress_state")
      .upsert(
        [
          {
            student_id,
            nbme_input,
            plan_output,
            fatigue_level,
            updated_at: new Date().toISOString()
          }
        ],
        { onConflict: "student_id" } // 1 registro por estudiante
      )
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ state saved for student", student_id);

    return res.status(200).json({
      success: true,
      message: "state saved",
      data
    });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({
      error: err && err.message ? err.message : "Internal Server Error"
    });
  }
};
