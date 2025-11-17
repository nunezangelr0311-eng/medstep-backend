// /api/get-progress.js
const getSupabaseClient = require("./_supabaseAdmin.js");

module.exports = async (req, res) => {
  try {
    const supabase = await getSupabaseClient();

    // Extraer student_id correctamente en Vercel
    const url = new URL(req.url, `http://${req.headers.host}`);
    const student_id = url.searchParams.get("student_id");

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    console.log("Fetching progress for:", student_id);

    // IMPORTANTE: usar maybeSingle() para no lanzar error
    const { data, error } = await supabase
      .from("step1_states") // <- CONFIRMA NOMBRE EXACTO DE LA TABLA
      .select("*")
      .eq("student_id", student_id)
      .maybeSingle();

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ error: "supabase_query_failed", detail: error.message });
    }

    // Si no existe aún un estado:
    if (!data) {
      return res.status(200).json({
        student_id,
        state: null,
        message: "No saved state found for this student"
      });
    }

    return res.status(200).json({
      student_id,
      state: data
    });

  } catch (err) {
    console.error("Handler exception:", err);
    return res.status(500).json({ error: "handler_failed", detail: err.message });
  }
};
