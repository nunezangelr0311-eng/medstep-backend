// ✅ Save-State endpoint para Vercel (Node) + Supabase + ACTIONS_SECRET

import { createClient } from "@supabase/supabase-js";

// 🔗 Configuración de Supabase con Service Role Key (solo backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Handler principal (formato Vercel Node)
export default async function handler(req: any, res: any) {
  // Solo permitimos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔐 Autorización con ACTIONS_SECRET
  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";
  const token = String(authHeader).replace("Bearer ", "").trim();
  const secret = process.env.ACTIONS_SECRET || "";

  console.log("🔹 Token recibido:", token);
  console.log("🔹 Secreto cargado:", secret ? "OK" : "undefined");

  if (!token || token !== secret) {
    console.warn("🚫 Token inválido o ausente");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 📥 Leer body (Hoppscotch envía JSON)
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return res
        .status(400)
        .json({ error: "Missing required fields" });
    }

    // 💾 Guardar / actualizar en Supabase
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
      console.error("❌ Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Registro insertado:", data);
    return res.status(200).json({
      success: true,
      message: "state saved",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error general:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
}
