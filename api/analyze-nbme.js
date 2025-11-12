const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Token de seguridad (WordPress -> Backend)
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    const valid = process.env.MEDSTEP_API_TOKEN || process.env.ACTIONS_SECRET;

    if (!token || !valid || token !== valid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { email, nbme_text } = req.body || {};
    if (!email || !nbme_text) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const prompt = `
You are MedStep Engine, an AI that analyzes NBME performance data for USMLE Step 1.

NBME data: ${nbme_text}

1) Identify weak vs strong systems.
2) Give 1–2 priority focus areas for the next study cycle.
3) Keep it concise, clinical and actionable.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are MedStep Engine." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 300
    });

    const text =
      completion?.choices?.[0]?.message?.content || "No response generated.";

    return res.status(200).json({
      email,
      result: text,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Analyze-nbme error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
};
