// api/analyze-nbme.js

import supabase from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      student_id,
      system_scores,
      weeks_to_exam,
      hours_per_day,
      fatigue_level,
    } = req.body || {};

    // Validación mínima
    if (!student_id) {
      return res.status(400).json({ error: "Missing field: student_id" });
    }
    if (!system_scores || typeof system_scores !== "object") {
      return res
        .status(400)
        .json({ error: "system_scores must be an object, e.g. { Cardio: 52 }" });
    }

    // 1) NBME input tal como lo mandas
    const nbme_input = system_scores;

    // 2) Plan de estudio "stub" (lógico pero simple)
    //    Ordena sistemas de menor a mayor puntaje y enfoca los más débiles
    const entries = Object.entries(system_scores); // [ ["Cardio",52], ... ]
    const sorted = entries.sort((a, b) => a[1] - b[1]); // asc
    const weakest = sorted.slice(0, 2).map(([name]) => name); // 2 más débiles

    const days = (weeks_to_exam && Number(weeks_to_exam) > 0)
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

    // 3) Insert en nbme_attempts
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
        error: `Supabase insert failed: ${error.message}`,
      });
    }

    // 4) Respuesta OK
    return res.status(200).json({
      ok: true,
      attempt_id: data.id,
      nbme_input: data.nbme_input,
      plan_output: data.plan_output,
    });
  } catch (err) {
    console.error("analyze-nbme handler error:", err);
    return res.status(500).json({
      error: `Handler failed: ${err.message}`,
    });
  }
}
