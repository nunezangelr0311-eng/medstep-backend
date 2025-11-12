// File: api/analyze-nbme.js
// Runtime: Node.js 18+ on Vercel (Serverless Function)
// Dependencies: "openai" en package.json

const OpenAI = require("openai");

/** ---------- CONFIG ---------- */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Usa un modelo estable; si no defines OPENAI_MODEL, usamos uno razonable.
// Evitamos enviar 'temperature' porque algunos modelos lo rechazan.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** ---------- PROMPT DE TONO (attending exigente) ---------- */
const systemPrompt = `
You are an attending physician crafting performance feedback for a USMLE Step 1 candidate.
Tone: demanding but supportive; concise, no fluff; clinically rigorous; board-style priorities.

Output format in Markdown (strict):
1) **Weak vs Strong Systems:** (one single compact line)
2) **Priority Focus Areas for Next Study Cycle:** (2–4 bullets)
   - Be specific: mechanisms, high-yield diseases, and critical pharmacology.
3) **Clinical Pearls (x3):** (three single-line pearls, directly applicable)
4) **Next Steps (x2):** (two concrete, actionable practice steps or resources)

Constraints:
- Do not repeat the input.
- Avoid generic statements. Be precise and exam-oriented.
- Keep it tight, punchy, and actionable.
`;

/** ---------- HELPERS ---------- */
function bad(res, code, message) {
  return res.status(code).json({ error: message });
}

function ok(res, payload) {
  return res.status(200).json(payload);
}

/** ---------- HANDLER ---------- */
module.exports = async (req, res) => {
  try {
    // CORS básico (opcional; útil cuando pruebas desde el navegador)
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(200).end();
    }
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Método
    if (req.method !== "POST") {
      return bad(res, 405, "Method not allowed");
    }

    // Auth
    const expected = process.env.ACTIONS_SECRET;
    const auth = req.headers.authorization || "";
    if (!expected) {
      return bad(res, 500, "Server misconfigured: ACTIONS_SECRET is missing");
    }
    if (!auth.startsWith("Bearer ")) {
      return bad(res, 401, "Missing or invalid Authorization header");
    }
    const token = auth.slice("Bearer ".length).trim();
    if (token !== expected) {
      return bad(res, 401, "Unauthorized");
    }

    // Body
    const { email, nbme_text } = req.body || {};
    if (!email || typeof email !== "string") {
      return bad(res, 400, "Invalid 'email'");
    }
    if (!nbme_text || typeof nbme_text !== "string") {
      return bad(res, 400, "Invalid 'nbme_text'");
    }

    // Normaliza el texto NBME (quitas espacios raros y evitas prompts largos)
    const nbmeLine = nbme_text.replace(/\s+/g, " ").trim();

    // Llamada al modelo (SIN temperature, para evitar 'Unsupported value')
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `Student NBME line: ${nbmeLine}\n` +
            `Return only the Markdown formatted as specified (strict).`,
        },
      ],
      // IMPORTANTE: no enviar 'temperature' para modelos que no lo soportan
      // temperature: 1, // <-- No lo enviamos
      // top_p, frequency_penalty, presence_penalty tampoco son necesarios aquí
    });

    const text =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "No result generated.";

    return ok(res, {
      email,
      result: text,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Errores útiles
    const detail =
      (err && err.response && err.response.data) ||
      err?.message ||
      String(err);

    // Log para Vercel
    console.error("analyze-nbme error:", detail);

    // Respuesta de error
    return res.status(500).json({
      error: "INTERNAL",
      detail,
    });
  }
};
