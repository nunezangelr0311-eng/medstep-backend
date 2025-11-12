// api/analyze-nbme.js
// MedStep Engine™ – Analyze NBME (tone-tuned, sin temperature)
// Requisitos en Vercel:
// - OPENAI_API_KEY
// - ACTIONS_SECRET
// Endpoint: POST /api/analyze-nbme  { email, nbme_text }

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function j(res, code, payload) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      j(res, 405, { error: 'Method not allowed' });
      return;
    }

    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token || token !== process.env.ACTIONS_SECRET) {
      j(res, 401, { error: 'Unauthorized' });
      return;
    }

    const { email, nbme_text } = safeBody(req);
    if (!email || !nbme_text) {
      j(res, 400, { error: 'Missing parameters' });
      return;
    }

    const systemPrompt = `
Eres un attending de USMLE Step 1 riguroso pero constructivo. Tu estilo:
- Preciso, clínico, directo; cero relleno y cero motivación vacía.
- Enfocado en decisiones y próximos pasos concretos por sistema.
- Prioriza fisiología clave, integración clínica y farmacología esencial.
- NO uses la frase "plan de 30 días" ni menciones "mensualidad" o suscripciones.
- Evita recomendaciones vagas; cada punto debe ser verificable/accionable.
- Mantén todo en español, salvo términos estándar (enzyme/receptor names).

PARÁMETROS DE ENTRADA (NBME_TEXT): puntuaciones por sistema (e.g., "Cardio 52, Endo 48, Renal 61...").
OBJETIVO: transformar esas puntuaciones en un ciclo de mejora de alto rendimiento.

FORMATO SALIDA (estrictamente este):
1) **Weak vs Strong Systems:**
   - **Weak Systems:** <lista con nombres y puntajes ascendentes>
   - **Strong Systems:** <lista con nombres y puntajes descendentes>

2) **Priority Focus Areas for Next Study Cycle:**
   - **<Sistema débil #1>:** 2–3 bullets específicos de alta ganancia.
   - **<Sistema débil #2>:** idem… (máx. 6 bullets totales)

3) **Core Drills (15–20 min):**
   - 3 tareas concretas de práctica activa y revisión espaciada.

4) **Red Flags to Fix Before Next NBME:**
   - 2–4 errores de concepto críticos y cómo corregirlos.

REGLAS:
- No planes por días/semanas; habla por “ciclo” y “bloques”.
- No repitas la entrada; no digas que eres IA; no menciones políticas.
- Listas limpias; negritas solo como en el formato.
- Sé conciso: ~200–260 palabras.
`.trim();

    const userPrompt = `NBME_TEXT:\n${nbme_text}\n\nEstudiante: ${email}`.trim();

    // ❗ Sin temperature/top_p/penalties para evitar el 400 del modelo.
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = (completion.choices?.[0]?.message?.content || '').trim();

    j(res, 200, {
      email,
      result: content,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('analyze-nbme error:', err?.message || err);
    j(res, 500, { error: 'INTERNAL', detail: String(err?.message || err) });
  }
};

function safeBody(req) {
  try {
    if (!req.body) return {};
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body;
  } catch {
    return {};
  }
}
