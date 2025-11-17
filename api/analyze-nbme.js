const getSupabaseClient = require("./_supabaseAdmin");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      student_id,
      system_scores,
      weeks_to_exam,
      hours_per_day,
      fatigue_level
    } = req.body || {};

    // Validación mínima
    if (!student_id || !system_scores) {
      return res.status(400).json({
        error: "Missing required fields: student_id and system_scores"
      });
    }

    // Obtener cliente Supabase funcionando
    const supabase = await getSupabaseClient();

    // EJEMPLO de uso real (ajústalo si necesitas):
    const { data, error } = await supabase
      .from("nbme_logs")
      .insert([
        {
          student_id,
          system_scores,
          weeks_to_exam,
          hours_per_day,
          fatigue_level,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    // Respuesta de prueba (puedes cambiarla)
    return res.status(200).json({
      success: true,
      inserted_id: data?.[0]?.id || null
    });

  } catch (err) {
    console.error("ANALYZE-NBME ERROR:", err);
    return res.status(500).json({
      error: "HANDLER_FAILED",
      message: err.message
    });
  }
};
