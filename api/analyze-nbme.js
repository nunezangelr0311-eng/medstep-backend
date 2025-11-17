// api/analyze-nbme.js
const supabase = require("./_supabaseAdmin.js");

module.exports = async function handler(req, res) {
  try {
    // Validar método
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Validar que las env de Supabase existan
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_ENV_MISSING", {
        url: !!process.env.SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });

      return res.status(500).json({
        error: {
          code: "SUPABASE_ENV_MISSING",
          message: "Supabase URL or SERVICE_ROLE_KEY not available in runtime",
        },
      });
    }

    const body = req.body || {};

    console.log("Incoming /analyze-nbme body:", body);

    const {
      student_id,
      system_scores,
      weeks_to_exam,
      hours_per_day,
      fatigue_level,
    } = body;

    // Validaciones mínimas
    if (!student_id) {
      return res.status(400).json({
        error: { code: "MISSING_STUDENT_ID", message: "student_id is required" },
      });
    }

    if (!system_scores || typeof system_scores !== "object") {
      return res.status(400).json({
        error: {
          code: "INVALID_SYSTEM_SCORES",
          message: "system_scores must be an object: { Cardio: 52 }",
        },
      });
    }

    // Cálculo del plan
    const sorted = Object.entries(system_scores).sort((a, b) => a[1] - b[1]);
    const weakest = sorted.slice(0, 2).map(([k]) => k);

    const days =
      weeks_to_exam && Number(weeks_to_exam) > 0
        ? Number(weeks_to_exam) * 7
        : 30;

    const plan_output = {
      days,
      focus: weakest,
      meta: {
        hours_per_day: hours_per_day ?? null,
        fatigue_level: fatigue_level ?? null,
      },
    };

    console.log("Will insert into nbme_attempts:", {
      student_id,
      system_scores,
      plan_output,
      fatigue_level,
    });

    const { data, error } = await supabase
      .from("nbme_attempts")
      .insert([
        {
          student_id,
          nbme_input: system_scores,
          plan_output,
          fatigue_level: fatigue_level ?? null,
        },
      ])
      .select()
      .single();

    console.log("Insert result:", { data, error });

    if (error) {
      return res.status(500).json({
        error: {
          code: "SUPABASE_INSERT_FAILED",
          message: error.message,
        },
      });
    }

    return res.status(200).json({
      ok: true,
      attempt_id: data.id,
      plan_output: data.plan_output,
    });
  } catch (err) {
    console.error("analyze-nbme handler exception:", err);
    return res.status(500).json({
      error: {
        code: "HANDLER_FAILED",
        message: err.message,
      },
    });
  }
};
