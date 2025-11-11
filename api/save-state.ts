// ✅ Secure Save-State Endpoint with Authorization, Supabase, and Debug Logs
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔗 Inicializa Supabase con la clave del backend (Service Role Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  // 🧩 Autenticación
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const secret = process.env.ACTIONS_SECRET;

  // 🧪 Debug logs (solo visibles en Vercel)
  console.log("🔹 Token recibido:", token);
  console.log("🔹 Secreto cargado:", secret ? "OK" : "undefined");

  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 📥 Leer datos del cuerpo de la solicitud
    const body = await req.json();
    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 💾 Insertar o actualizar progreso en Supabase
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
      console.error("❌ Error Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Respuesta final
    return NextResponse.json({
      success: true,
      message: "state saved",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error general:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
