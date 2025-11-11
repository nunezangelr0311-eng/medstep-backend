// ✅ MedStep Save-State endpoint
// Compatible con Vercel Serverless (Node), Supabase y ACTIONS_SECRET
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // 🌐 CORS básico (válido para Hoppscotch, frontend, etc.)
  res.setHeader("Access-Control-Allow-Origin", "*"); // luego puedes limitar a tu dominio
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Solo POST permitido
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Variables necesarias
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.ACTIONS_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !secret) {
      console.error("Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasSecret: !!secret,
      });
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing environment variables" });
    }

    // 🔐 Autorización Bearer
    const rawAuth =
      (req.headers.authorization as string) ||
      (req.headers.Authorization as string) ||
      "";
    const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

    if (!token || token !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 📥 Body JSON
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return res
        .status(400)
        .json({ error: "Missing required fields" });
    }

    // 🔗 Supabase client (solo aquí, después de validar env)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 💾 Guardar / actualizar progreso
    const { data, error } = await supabase
      .from("progress_state")
      .upsert([
        {
          student_id,
          nbme_input,
          plan_output,
          fatigue_level,
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "state saved",
      data,
    });
  } catch (err: any) {
    console.error("Handler error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal Server Error" });
  }
}
