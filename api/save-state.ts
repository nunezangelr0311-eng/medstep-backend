// ✅ Secure Save-State Endpoint using Service Role Key + ACTIONS_SECRET
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🧩 Cargar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serverSecret = process.env.ACTIONS_SECRET || ""; // 👈 Clave de autorización principal

// Inicializa Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ✅ Ruta principal
export async function POST(req: NextRequest) {
  try {
    // 🧠 Validar autorización
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    console.log("🔹 Token recibido:", token);
    console.log("🔹 Secreto cargado:", serverSecret ? "OK" : "undefined");

    if (!token || token !== serverSecret) {
      console.warn("🚫 Token inválido o ausente.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Leer el cuerpo del request
    const body = await req.json();
    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 💾 Insertar o actualizar datos en Supabase
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Registro insertado correctamente:", data);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("❌ Error general:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
