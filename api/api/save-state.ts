import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { student_id, nbme_input, plan_output, fatigue_level } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "Missing student_id" });
    }

    const SUPABASE_FUNCTION_URL = process.env.SUPABASE_URL!;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        student_id,
        nbme_input,
        plan_output,
        fatigue_level,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Supabase Edge Function error");
    }

    return res.status(200).json({
      success: true,
      message: "Progress saved successfully",
      data,
    });
  } catch (error: any) {
    console.error("❌ Save-State Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
}
