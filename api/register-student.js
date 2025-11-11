// api/register-student.js
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
    const { email, name } = req.body || {};

    if (!email || !name) {
      return res
        .status(400)
        .json({ error: "Missing required fields: email, name" });
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (findError) {
      console.error("Supabase find student error:", findError);
      return res.status(500).json({ error: "Database lookup failed" });
    }

    if (existing) {
      return res.status(200).json({
        success: true,
        student_id: existing.id,
        status: "exists",
      });
    }

    const { data: created, error: insertError } = await supabaseAdmin
      .from("students")
      .insert([
        {
          email: email.toLowerCase().trim(),
          name,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("Supabase insert student error:", insertError);
      return res.status(500).json({ error: "Failed to create student" });
    }

    return res.status(201).json({
      success: true,
      student_id: created.id,
      status: "created",
    });
  } catch (err) {
    console.error("register-student fatal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
