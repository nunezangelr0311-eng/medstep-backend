// api/analyze-nbme.js  (CommonJS + Express)

const supabase = require("./_supabaseAdmin");

module.exports = function (app) {
  app.post("/api/analyze-nbme", async (req, res) => {
    try {
      const {
        student_id,
        system_scores,
        weeks_to_exam,
        hours_per_day,
        fatigue_level,
      } = req.body || {};

      // Validaciones mínimas
      if (!student_id) {
        return res.status(400).json({
          error: { code: "MISSING_STUDENT_ID", message: "Missing field: student_id" },
        });
      }

      if (!system_scores || typeof system_scores !== "object") {
        return res.status(400).json({
          error: {
            code: "INVALID_SYSTEM_SCORES",
            message: "system_scores must be an object, e.g. { Cardio: 52 }",
          },
        });
      }

      // NBME input tal como llega
      const nbme_input = system_scores;

      // Plan simple: enfocar en los 2 sistemas más débiles
      const entries = Object.entries(system_scores); // [ ["Cardio",52], ... ]
      const sorted = entries.sort((a, b) => a[1] - b[1]);
      const weakest = sorted.slice(0, 2).map(([name]) => name);

      const days =
        weeks_to_exam && Number(weeks_to_exam) > 0
          ? Number(weeks_to_exam) * 7
          : 30;

      const plan_output = {
        days,
        focus: weakest,
        meta: {
          hours_per_day: hours_per_day || null,
          fatigue_level: fatigue_level ?? null,
        },
      };

      // Insertar intento en nbme_attempts
      const { data, error } = await supabase
        .from("nbme_attempts")
        .insert([
          {
            student_id,
            nbme_input,
            plan_output,
            fatigue_level: fatigue_level ?? null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({
          error: {
            code: "SUPABASE_INSERT_FAILED",
            message: error.message,
          },
        });
      }

      // OK
      return res.status(200).json({
        ok: true,
        attempt_id: data.id,
        nbme_input: data.nbme_input,
        plan_output: data.plan_output,
      });
    } catch (err) {
      console.error("analyze-nbme handler error:", err);
      return res.status(500).json({
        error: {
          code: "HANDLER_FAILED",
          message: err.message,
        },
      });
    }
  });
};
