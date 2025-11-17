// /api/get-progress.js
const getSupabaseClient = require("./_supabaseAdmin.js");

module.exports = async (req, res) => {
  try {
    const supabase = await getSupabaseClient();

    // CORREGIDO: req.query NO EXISTE en serverless
    const url = new URL(req.url, `http://${req.headers.host}`);
    const student_id = url.searchParams.get("student_id");

    if (!student_id) {
      return res.status(400).json({
        error: "student_id is required"
      });
    }

    console.log("Fetching progress for:", student_id);

    const { data, error } = await supabase
      .from("step1_states")
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
