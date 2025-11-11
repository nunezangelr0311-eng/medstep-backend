// api/save-state.js
import { supabaseAdmin } from "./_supabaseAdmin";

const BACKEND_TOKEN = process.env.ACTIONS_SECRET || "MedStep2025SecureToken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (token !== BACKEND_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { student_id, nbme_input, plan_output, fatigue_level } = req.body || {};

    if (!student_id || !nbme_input || !plan_output) {
      return res.status(400).json({
        error:
          "Missing required fields: student_id, nbme_input, plan_output are required",
      });
    }

    // asegúrate de que el student_id existe
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("id", student_id)
      .maybeSingle();

    if (studentError) {
      console.error("Supabase find student error:", studentError);
      return res.status(500).json({ error: "Database lookup failed" });
    }

    if (!student) {
      return res.status(400).json({
        error:
          "Student not found for given student_id. Ensure it exists in 'students' table.",
      });
    }

    // guardar intento en nbme_attempts
    const { error: attemptsError } = await supabaseAdmin
      .from("nbme_attempts")
      .insert([
        {
          student_id,
          nbme_input,
          plan_output,
        },
      ]);

    if (attemptsError) {
      console.error("Insert nbme_attempts error:", attemptsError);
      return res.status(500).json({ error: "Failed to save NBME attempt" });
    }

    // opcional: mantener último estado en progress_state
    const { data, error: upsertError } = await supabaseAdmin
      .from("progress_state")
      .upsert(
        [
          {
            student_id,
            nbme_input,
            plan_output,
            fatigue_level: fatigue_level ?? null,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "student_id" }
      )
      .select();

    if (upsertError) {
      console.error("Supabase upsert progress_state error:", upsertError);
      return res.status(500).json({ error: "Failed to save progress state" });
    }

    return res.status(200).json({
      success: true,
      message: "state saved",
      data,
    });
  } catch (err) {
    console.error("save-state fatal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
