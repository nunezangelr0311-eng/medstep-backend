// api/analyze-nbme.js
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
    const {
      student_uuid,
      attempt_label,
      date,
      system_scores,
      weeks_to_exam,
      hours_per_day,
      fatigue_level,
    } = req.body || {};

    if (!student_uuid || !system_scores) {
      return res
        .status(400)
        .json({ error: "student_uuid and system_scores are required" });
    }

    // 1) Guardar intento NBME
    const { data: insertedAttempt, error: insertError } = await supabase
      .from("nbme_attempts")
      .insert([
        {
          student_uuid,
          label: attempt_label || null,
          exam_date: date || new Date().toISOString(),
          system_scores,      // JSONB
          weeks_to_exam,
          hours_per_day,
          fatigue_level,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("nbme_attempts insert error:", insertError);
      return res.status(500).json({ error: "Failed to save NBME attempt" });
    }

    // 2) Traer todos los intentos del estudiante
    const { data: attempts, error: fetchError } = await supabase
      .from("nbme_attempts")
      .select(
        "exam_date,label,system_scores,weeks_to_exam,hours_per_day,fatigue_level"
      )
      .eq("student_uuid", student_uuid)
      .order("exam_date", { ascending: true });

    if (fetchError) {
      console.error("nbme_attempts fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch attempts" });
    }

    // 3) Llamar a OpenAI para análisis
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are MedStep Engine, an NBME Step 1 performance coach. Always answer in compact JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            attempts,
            weeks_to_exam,
            hours_per_day,
            fatigue_level,
          }),
        },
      ],
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // 4) Guardar último análisis en progress_state
    const { data: progressRow, error: upsertError } = await supabase
      .from("progress_state")
      .upsert(
        {
          student_uuid,
          last_analysis: analysis, // JSONB
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_uuid" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("progress_state upsert error:", upsertError);
    }

    return res.status(200).json({
      ok: true,
      attempt: insertedAttempt,
      analysis,
      progress: progressRow || null,
    });
  } catch (err) {
    console.error("analyze-nbme error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
