// api/save-state.js
import supabase from "./_supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { student_uuid, updated_state } = req.body || {};

    if (!student_uuid || !updated_state) {
      return res
        .status(400)
        .json({ error: "student_uuid and updated_state are required" });
    }

    const { data, error } = await supabase
      .from("progress_state")
      .upsert(
        {
          student_uuid,
          last_state: updated_state, // JSONB con progreso diario/semana
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_uuid" }
      )
      .select()
      .single();

    if (error) {
      console.error("progress_state save-state error:", error);
      return res.status(500).json({ error: "Failed to save state" });
    }

    return res.status(200).json({
      ok: true,
      saved_state: data,
    });
  } catch (err) {
    console.error("save-state error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
