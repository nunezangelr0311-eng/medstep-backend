const express = require("express");
const supabase = require("./_supabaseAdmin");

const app = express();
app.use(express.json());

app.post("/api/analyze-nbme", async (req, res) => {
  try {
    const { student_id, system_scores, weeks_to_exam, hours_per_day, fatigue_level } = req.body;

    if (!student_id) return res.status(400).json({ error: "MISSING_STUDENT_ID" });
    if (!system_scores) return res.status(400).json({ error: "INVALID_SYSTEM_SCORES" });

    const sorted = Object.entries(system_scores).sort((a,b)=>a[1]-b[1]);
    const weakest = sorted.slice(0,2).map(i=>i[0]);
    const days = (weeks_to_exam && weeks_to_exam>0) ? weeks_to_exam*7 : 30;

    const finalPlan = {
      days,
      focus: weakest,
      meta: {
        hours_per_day: hours_per_day ?? null,
        fatigue_level: fatigue_level ?? null
      }
    };

    const { data, error } = await supabase
      .from("nbme_attempts")
      .insert([{ student_id, nbme_input: system_scores, plan_output: finalPlan }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true, attempt_id: data.id, plan_output: finalPlan });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ESTA LÍNEA ES CLAVE PARA VERCEL
module.exports = app;
