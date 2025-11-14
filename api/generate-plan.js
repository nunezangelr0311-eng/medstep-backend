const supabase = require("./_supabaseAdmin");

module.exports = function (app) {
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const { student_id, nbme_data, fatigue_level, hours_per_day } = req.body || {};

      if (!student_id) {
        return res.status(400).json({
          error: { code: "MISSING_STUDENT_ID", message: "Missing field: student_id" },
        });
      }

      if (!nbme_data || typeof nbme_data !== "object") {
        return res.status(400).json({
          error: {
            code: "INVALID_NBME_DATA",
            message: "nbme_data must be an object",
          },
        });
      }

      // Ordenar para identificar debilidades
      const sorted = Object.entries(nbme_data).sort((a, b) => a[1] - b[1]);
      const weakest = sorted.slice(0, 2).map(([name]) => name);

      const plan = {
        days: 30,
        focus: weakest,
        meta: {
          fatigue_level: fatigue_level ?? null,
          hours_per_day: hours_per_day ?? null,
        },
      };

      return res.status(200).json({
        ok: true,
        plan,
      });
    } catch (err) {
      console.error("generate-plan error:", err);
      return res.status(500).json({
        error: {
          code: "HANDLER_FAILED",
          message: err.message,
        },
      });
    }
  });
};
