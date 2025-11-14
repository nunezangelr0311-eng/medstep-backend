const supabase = require("./_supabaseAdmin");

module.exports = function (app) {
  app.post("/api/save-state", async (req, res) => {
    try {
      const { student_id, plan_state } = req.body || {};

      if (!student_id) {
        return res.status(400).json({
          error: { code: "MISSING_STUDENT_ID", message: "Missing field: student_id" },
        });
      }

      if (!plan_state || typeof plan_state !== "object") {
        return res.status(400).json({
          error: {
            code: "INVALID_PLAN_STATE",
            message: "plan_state must be an object",
          },
        });
      }

      const { data, error } = await supabase
        .from("progress_state")
        .upsert(
          {
            student_id,
            state: plan_state,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("supabase save-state insert error:", error);
        return res.status(500).json({
          error: { code: "SUPABASE_SAVE_FAILED", message: error.message },
        });
      }

      return res.status(200).json({
        ok: true,
        updated: data,
      });
    } catch (err) {
      console.error("save-state handler error", err);
      return res.status(500).json({
        error: {
          code: "HANDLER_FAILED",
          message: err.message,
        },
      });
    }
  });
};
