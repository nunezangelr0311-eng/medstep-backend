import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // Verifica método
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Seguridad del token
    const authHeader = req.headers.authorization || "";
    const providedToken = authHeader.replace("Bearer ", "").trim();
    const validToken =
      process.env.MEDSTEP_API_TOKEN || process.env.ACTIONS_SECRET;

    if (!providedToken || providedToken !== validToken) {
      console.error("❌ Token inválido o ausente");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verifica que el JSON venga correcto
    const { email, nbme_text } = req.body || {};
    if (!email || !nbme_text) {
      console.error("❌ Faltan parámetros en body:", req.body);
      return res.status(400).json({
        error: "Missing parameters",
        required: ["email", "nbme_text"],
      });
    }

    // Inicializa cliente OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Falta OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Genera análisis simple
    const prompt = `
You are MedStep Engine, an AI NBME performance analyzer.
Analyze the student's input and classify each system by strength level (Strong / Moderate / Weak),
then suggest 1 adaptive focus area for next cycle.

NBME Data: ${nbme_text}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are MedStep Engine AI assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const output = completion.choices?.[0]?.message?.content || "No output";

    console.log("✅ Analysis generated successfully for:", email);

    return res.status(200).json({
      email,
      analysis: output,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🔥 Internal Server Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
