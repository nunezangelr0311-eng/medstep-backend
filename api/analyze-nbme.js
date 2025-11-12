// api/analyze-nbme.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // o tu dominio
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  cors(res);

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Seguridad simple por token
    const auth = req.headers.authorization || '';
    const token = auth.split(' ')[1];
    if (token !== process.env.ACTIONS_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, nbme_text } = req.body || {};
    if (!email || !nbme_text) {
      return res.status(400).json({ error: 'Missing email or nbme_text' });
    }

    // Prompt “attending exigente”
    const prompt = `
You are a demanding but constructive USMLE Step 1 attending. Analyze the student's NBME string and produce a concise, high-yield feedback:
- Classify systems: Weak (<=50), Moderate (51–59), Strong (>=60).
- Give 2–3 **specific** subtopics per weak system (actionable, high-yield).
- One **weekly focus plan** (bullets) and 1–2 “non-negotiables”.
- Tone: direct, clinical, zero fluff. No 30-day plan wording.

NBME: ${nbme_text}
Output in Markdown only.
`;

    // Usa un modelo que no requiera temperature custom (por si acaso)
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      // No poner temperature/top_p si tu despliegue dio error con eso
    });

    const result = resp.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({
      email,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'INTERNAL',
      detail: err?.message || 'unknown'
    });
  }
};
