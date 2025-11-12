// api/analyze-nbme.js
// MedStep Engine™ – Analyze NBME (tone-tuned)
// Requisitos en Vercel:
// - OPENAI_API_KEY (secreto)
// - ACTIONS_SECRET (token Bearer que usas desde WordPress)
// Endpoint: POST /api/analyze-nbme  { email, nbme_text }

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utilidad segura
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

    // Autorización tipo Bearer desde WP (no exponer en frontend)
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

    // ---------- PROMPT AFINADO (TONO: attending exigente pero constructivo) ----------
    const systemPrompt = `
Eres un attending de USMLE Step 1 riguroso pero constructivo. Tu estilo:
- Preciso, clínico, directo; cero relleno y cero motivación vacía.
- Enfocado en decisiones y próximos pasos concretos por sistema.
- Prioriza fisiología clave, integración clínica y farmacología esencial.
- NO uses la frase "plan de 30 días" ni menciones "mensualidad" o suscripciones.
- Evita recomendaciones vagas; cada punto debe ser verificable/accionable.
- Mantén todo en español, salvo términos estándar (e.g., enzyme names, receptor names).

PARÁMETROS DE ENTRADA (NBME_TEXT): puntuaciones por sistema (e.g., "Cardio 52, Endo 48, Renal 61...").
OBJETIVO: transformar esas puntuaciones en un ciclo de mejora de alto rendimiento.

FORMATO SALIDA (estrictamente este, para render limpio en WP):
1) **Weak vs Strong Systems:**
   - **Weak Systems:** <lista con nombres y puntajes ascendentes>
   - **Strong Systems:** <lista con nombres y puntajes descendentes>

2) **Priority Focus Areas for Next Study Cycle:**
   - **<Sistema débil #1>:** 2–3 bullets de foco con temas específicos de alta ganancia (no teorías genéricas).
   - **<Sistema débil #2>:** idem…
   (hasta 2–3 sistemas, máximo 6 bullets totales)

3) **Core Drills (15–20 min):**
   - 3 tareas concretas de práctica activa y revisión espaciada (formato breve: acción + recurso/tema exacto).

4) **Red Flags to Fix Before Next NBME:**
   - 2–4 errores de concepto críticos que el estudiante suele cometer con esos puntajes y cómo corregirlos.

REGLAS:
- No escribas planes por días-semanas; habla por “ciclo” y por “bloques”.
- No repitas la entrada; no digas que eres IA; no menciones políticas.
- Mantén listas limpias con guiones o bullets; usa negritas solo como en el formato.
- Sé conciso: máximo ~200–260 palabras.
`.trim();

    const userPrompt = `
NBME_TEXT:
${nbme_text}

Estudiante: ${email}
`.trim();

    // Hyperparams: tono sobrio, estable, accionable
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      temperature: 0.3,
      top_p: 0.85,
      presence_penalty: 0.1,
      frequency_penalty: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = (completion.choices?.[0]?.message?.content || '').trim();

    // Respuesta estándar esperada por el plugin WP
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
