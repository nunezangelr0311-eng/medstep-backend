// /api/get-progress.js
const getSupabaseClient = require("./_supabaseAdmin.js");

module.exports = async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({
        error: "student_id is required"
      });
    }

    const { data, error } = await supabase
      .from("step1_states")   // ← CORREGIDO
      .select("*")
      .eq("student_id", student_id)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({
        error: "internal_server_error"
      });
    }

    return res.status(200).json({
      student_id,
      state: data
    });

  } catch (err) {
    console.error("Handler exception:", err);
    return res.status(500).json({
      error: "internal_server_error"
    });
  }
};
