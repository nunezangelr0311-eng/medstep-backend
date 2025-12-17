const getSupabaseClient = require("./_supabaseAdmin.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for registration." });
  }

  try {
    const supabase = await getSupabaseClient();

    const { email, name } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ error: "Missing email" });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("students")
      .upsert(
        { email: cleanEmail, name: name ?? null, updated_at: now },
        { onConflict: "email" }
      )
      .select("id,email,name")
      .single();

    if (error) {
      return res.status(500).json({ error: "SUPABASE_UPSERT_FAILED", detail: error.message });
    }

    return res.status(200).json({
      ok: true,
      student_id: data.id,
      email: data.email,
      name: data.name
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
};
