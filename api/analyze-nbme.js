// ✅ analyze-nbme.js — versión blindada contra FUNCTION_INVOCATION_FAILED

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 🔒 Token de seguridad
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    const valid =
      process.env.MEDSTEP_API_TOKEN || process.env.ACTIONS_SECRET;

    if (!token || token !== valid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔎 Validar body
    const { email, nbme_text } = req.body || {};
    if (!email || !nbme_text) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // ⚙️ Comprobar clave de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error("🚨 OPENAI_API_KEY no definida");
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    // 🧠 Inicializar cliente OpenAI (forma compatible con Vercel runtime)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 🧩 Prompt
    const prompt = `
You are MedStep Engine, an AI that analyzes NBME performance data and identifies focus areas.

NBME data: ${nbme_text}
Summarize weak and strong systems and suggest one priority focus for the next cycle.
`;

    // 🚀 Llamada segura
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are MedStep Engine." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content || "No response generated.";

    return res.status(200).json({
      email,
      result: text,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("🔥 Error interno:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      stack: err.stack,
    });
  }
}
