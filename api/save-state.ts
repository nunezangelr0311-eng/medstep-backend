// ✅ Secure Save-State Endpoint (Redeploy Trigger Version)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔗 Supabase setup (Service Role Key del backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  // 🔐 Autenticación
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const secret = process.env.ACTIONS_SECRET;

  // 🧪 Depuración temporal: confirmar lectura de variables
  console.log("🔹 Token recibido:", token);
  console.log("🔹 Secreto cargado:", secret ? "OK" : "undefined");

  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { student_id, nbme_input, plan_output, fatigue_level } = body;

    if (!student_id || !nbme_input || !plan_output) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("progress_state")
      .upsert([
        {
          student_id,
          nbme_input,
          plan_output,
