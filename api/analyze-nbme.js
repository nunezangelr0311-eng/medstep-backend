// api/analyze-nbme.js
// Serverless Function (Vercel, Node 22) — CommonJS íntegro
// Requiere: OPENAI_API_KEY en Vercel (Project → Settings → Environment Variables)
// Opcional: ACTIONS_SECRET (si prefieres no hardcodear el token)

// ---------- Imports ----------
const OpenAI = require("openai");

// ---------- Config ----------
const ALLOWED_ORIGIN = "*"; // ajusta si quieres restringir CORS
const DEFAULT_WEEKS = 4;
const DEFAULT_HOURS_PER_DAY = 3;
const STATIC_BEARER = "MedStep2025SecureToken"; // compatibilidad con tus pruebas

// ---------- Helpers ----------
function sendJSON(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

// Normaliza pares "Sistema 58" desde texto suelto
function parseScores(nbmeText) {
  const map = {
    cardio: "Cardio",
    cardiovascular: "Cardio",
    endo: "Endocrine",
    endocrine: "Endocrine",
    endócrino: "Endocrine",
    renal: "Renal",
    gi: "Gastro",
    gastro: "Gastro",
    gastrointestinal: "Gastro",
    "hema onco": "Hema-Onco",
    hemaonco: "Hema-Onco",
    "hema-onco": "Hema-Onco",
    hema: "Hema-Onco",
    onco: "Hema-Onco",
    musculo: "Musculo",
    músculo: "Musculo",
    neuro: "Neuro",
    psych: "Psych",
    micro: "Micro",
    microbiology: "Micro",
    pharm: "Pharm",
    pharmacology: "Pharm",
  };

  const norm = String(nbmeText || "")
    .toLowerCase()
    .replace(/[,;|]/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  const pairs = norm.split(",").map((x) => x.trim()).filter(Boolean);
  const out = [];

  for (const p of pairs) {
    const m = p.match(/([a-záéíóú\- ]+)\s*[:=]?\s*(\d{2})/i);
    if (!m) continue;
    const raw = m[1].trim();
    const score = Number(m[2]);
    let key = raw;
    Object.keys(map).forEach((k) => {
      if (raw.includes(k)) key = map[k];
    });
    key = key.charAt(0).toUpperCase() + key.slice(1);
    out.push({ system: key, score });
  }
  return out;
}

// ---------- Handler ----------
module.exports = async (req, res) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    return sendJSON(res, 405, { error: "Method not allowed" });
  }

  try {
    // --- Auth (compatibilidad con tus pruebas) ---
    const auth = req.headers["authorization"] || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const expected = process.env.ACTIONS_SECRET || STATIC_BEARER;
    if (token !== expected) {
      return sendJSON(res, 401, { error: "Unauthorized" });
    }

    // --- Body ---
    const body = await parseBody(req);
    const email = body.email || "student@example.com";
    const nbme_text = body.nbme_text || body.nbme || "";
    const weeks = Number(body.weeks || DEFAULT_WEEKS);
    const hours_per_day = Number(body.hours_per_day || DEFAULT_HOURS_PER_DAY);

    const scores = parseScores(nbme_text);
    if (!scores.length) {
      return sendJSON(res, 400, {
        error: "Bad request",
        detail: "No valid scores found in nbme_text.",
      });
    }

    const sorted = [...scores].sort((a, b) => a.score - b.score);
    const weak = sorted.slice(0, Math.min(3, sorted.length));
    const strong = sorted.slice(-3).reverse();

    // --- Prompting robusto para plan detallado ---
    const system = `
You are "MedStep Engine – Step 1 Planner", an exacting but supportive attending.
Your job is to produce a COMPLETE, EXECUTABLE plan that a Step 1 candidate can follow without ad-hoc decisions.
Use evidence-based sequencing: weak systems first, spacing, interleaving, and daily mixed review.
Always include weekly goals, daily timeboxed blocks (start–end), specific reading, ANKI target, QBank target, and checkpoints with objective criteria.
Tone: concise, clinical, constructive. No fluff.`;

    // Esquema esperado (referencia para el modelo, usamos response_format=json_object)
    const user = `
NBME raw: ${nbme_text}

Detected (asc): ${sorted.map((s) => `${s.system} ${s.score}`).join(", ")}
Weak (≤3): ${weak.map((w) => w.system).join(", ")}
Strong (top 3): ${strong.map((s) => s.system).join(", ")}

Constraints & preferences:
- Weeks until exam: ${weeks}
- Hours per day available: ${hours_per_day}
- DAILY PLAN MUST be timeboxed (start–end) and include: reading, ANKI target, QBank target.
- Interleave weak systems in first 2–3 weeks; maintain strong systems via short refresh blocks.
- Include weekly checkpoints with explicit pass criteria (e.g., ≥60% in weak systems on mixed QBank).

Return STRICT JSON with the following shape (plus a readable Markdown copy in "markdown"):

{
  "meta": {
    "weeks": number,
    "hours_per_day": number,
    "weak_systems": string[],
    "strong_systems": string[]
  },
  "weekly_plan": [
    {
      "week": number,
      "theme": string,
      "days": [
        {
          "day": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
          "blocks": [
            {"start":"08:00","end":"10:00","focus":"Endocrine — HPA axis pharm"},
            {"start":"10:15","end":"12:00","focus":"QBank mixed (weak systems)"}
          ],
          "reading": "First Aid §§, Sketchy…, etc.",
          "anki": "2K reviews / 200 new if applicable",
          "qbank": {"questions": 40, "notes_focus": "Endocrine pharm mistakes"}
        }
      ]
    }
  ],
  "practice_targets": {
    "daily_qbank": number,
    "weekly_full_block": number,
    "mixed_review": string
  },
  "checkpoints": [
    {"when":"End of Week 2 (Sun 20:00)","what":"NBME/SA + weak-systems custom block","criteria_to_pass":"≥60% weak systems, note 3 key error patterns"}
  ],
  "markdown": "…full human-readable plan…"
}`;

    // --- OpenAI call (sin temperature; aumentamos tokens) ---
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5", // usa el que ya configuraste
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // NO usar temperature para evitar el error del modelo.
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    // --- Parseo robusto ---
    let plan;
    const raw = completion?.choices?.[0]?.message?.content || "{}";
    try {
      plan = JSON.parse(raw);
    } catch {
      const i = raw.indexOf("{");
      const j = raw.lastIndexOf("}");
      plan = JSON.parse(raw.slice(i, j + 1));
    }

    // Enriquecemos meta por si faltara
    plan.meta = plan.meta || {};
    plan.meta.weeks = weeks;
    plan.meta.hours_per_day = hours_per_day;
    plan.meta.weak_systems = weak.map((w) => w.system);
    plan.meta.strong_systems = strong.map((s) => s.system);

    return sendJSON(res, 200, {
      email,
      plan,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("analyze-nbme error:", err);
    return sendJSON(res, 500, {
      error: "INTERNAL",
      detail: err?.message || "Unexpected error",
    });
  }
};
