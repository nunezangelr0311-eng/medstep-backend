// api/get-progress.js
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
    const { student_id } = req.body || {};

    if (!student_id) {
      return res
        .status(400)
        .json({ error: "Missing required field: student_id" });
    }

    // último estado
    const { data: state, error: stateError } = await supabaseAdmin
      .from("progress_state")
      .select("nbme_input, plan_output, fatigue_level, updated_at")
      .eq("student_id", student_id)
      .maybeSingle();

    if (stateError) {
      console.error("get-progress state error:", stateError);
      return res.status(500).json({ error: "Failed to fetch progress state" });
    }

    // historial resumido de intentos
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("nbme_attempts")
      .select("id, nbme_input, plan_output, created_at")
      .eq("student_id", student_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (attemptsError) {
      console.error("get-progress attempts error:", attemptsError);
      return res.status(500).json({ error: "Failed to fetch attempts" });
    }

    return res.status(200).json({
      success: true,
      student_id,
      latest_state: state || null,
      attempts: attempts || [],
    });
  } catch (err) {
    console.error("get-progress fatal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
