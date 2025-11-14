// api/get-progress.js
import supabase from "./_supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { student_uuid } = req.query;

    if (!student_uuid) {
      return res.status(400).json({ error: "student_uuid is required" });
    }

    const { data: state, error: stateError } = await supabase
      .from("progress_state")
      .select("last_analysis,study_plan,last_state,updated_at")
      .eq("student_uuid", student_uuid)
      .maybeSingle();

    if (stateError) {
      console.error("progress_state fetch error:", stateError);
      return res.status(500).json({ error: "Failed to fetch progress" });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("nbme_attempts")
      .select("exam_date,label,system_scores")
      .eq("student_uuid", student_uuid)
      .order("exam_date", { ascending: true });

    if (attemptsError) {
      console.error("nbme_attempts fetch error:", attemptsError);
      return res.status(500).json({ error: "Failed to fetch attempts" });
    }

    return res.status(200).json({
      ok: true,
      progress_state: state || null,
      nbme_attempts: attempts || [],
    });
  } catch (err) {
    console.error("get-progress error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
