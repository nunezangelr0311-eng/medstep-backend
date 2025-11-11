import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Inicializar OpenAI y Supabase
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint principal
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, nbme_text } = req.body;

  if (!email || !nbme_text) {
    return res.status(400).json({ error: "Missing email or NBME text" });
  }

  try {
    // 1️⃣ Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are MedStep Engine, an AI mentor that analyzes NBME Step 1 performance and creates adaptive 30-day recovery plans.",
        },
        {
          role: "user",
          content: `NBME results for ${email}: ${nbme_text}. 
          Analyze each system (e.g., Cardio, Endo, Renal...) as Strong, Moderate, or Weak. 
          Then generate a JSON response with the following keys: 
          plan_30_days, daily_checkpoint, weekly_checkpoint, summary.`,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // 2️⃣ Guardar en Supabase (opcional)
    await supabase
      .from("progress_state")
      .insert([{ email, nbme_text, ai_output: aiResponse }]);

    // 3️⃣ Responder al cliente
    return res.status(200).json({
      success: true,
      plan: aiResponse,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
