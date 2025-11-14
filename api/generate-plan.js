// api/generate-plan.js
import supabase from "./_supabaseAdmin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { student_uuid } = req.body || {};

    if (!student_uuid) {
      return res.status(400).json({ error: "student_uuid is required" });
    }

    // 1) Traer análisis reciente y último NBME
    const { data: state, error: stateError } = await supabase
      .from("progress_state")
      .select("last_analysis")
      .eq("student_uuid", student_uuid)
      .maybeSingle();

    if (stateError) {
      console.error("progress_state fetch error:", stateError);
      return res.status(500).json({ error: "Failed to fetch state" });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("nbme_attempts")
      .select(
        "exam_date,label,system_scores,weeks_to_exam,hours_per_day,fatigue_level"
      )
      .eq("student_uuid", student_uuid)
      .order("exam_date", { ascending: true });

    if (attemptsError) {
      console.error("nbme_attempts fetch error:", attemptsError);
      return res.status(500).json({ error: "Failed to fetch attempts" });
    }

    if (!attempts || attempts.length === 0) {
      return res.status(400).json({ error: "No NBME attempts found" });
    }

    const lastAttempt = attempts[attempts.length - 1];

    // 2) Pedir plan de 30 días
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are MedStep Engine, an NBME Step 1 study planner. Always respond in JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            last_analysis: state?.last_analysis || null,
            attempts,
            weeks_to_exam: lastAttempt.weeks_to_exam,
            hours_per_day: lastAttempt.hours_per_day,
            fatigue_level: lastAttempt.fatigue_level,
          }),
        },
        {
          role: "user",
          content: `
Create a 30-day plan with:
- plan_30_days: array[30] of { day_index, focus_systems, tasks, estimated_hours }
- weekly_checkpoints: array[4] of { week, goals, how_to_evaluate }
- coaching_notes: short tips for the student.

Return ONLY JSON.`,
        },
      ],
    });

    const plan = JSON.parse(completion.choices[0].message.content);

    // 3) Guardar plan en progress_state
    const { data: savedState, error: upsertError } = await supabase
      .from("progress_state")
      .upsert(
        {
          student_uuid,
          last_analysis: state?.last_analysis || null,
          study_plan: plan, // JSONB
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_uuid" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("progress_state upsert error:", upsertError);
      return res.status(500).json({ error: "Failed to save plan" });
    }

    return res.status(200).json({
      ok: true,
      plan,
      state: savedState,
    });
  } catch (err) {
    console.error("generate-plan error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
