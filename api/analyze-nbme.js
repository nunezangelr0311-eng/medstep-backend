// api/analyze-nbme.js

// Función auxiliar: convierte "Cardio 52, Endo 48, Renal 61"
// en un mapa { Cardio: { score: 52, level: "Weak" }, ... }
function parseSystemScores(raw) {
  const text = String(raw || "");
  const result = {};

  // Separar por coma, punto y coma o salto de línea
  const parts = text.split(/[,;\n]/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Ejemplo que matchea: "Cardio 52"
    const match = trimmed.match(/^(.+?)\s+(\d{1,3})$/);
    if (!match) continue;

    const name = match[1].trim();
    const score = Number(match[2]);

    let level;
    if (score >= 70) {
      level = "Strong";
    } else if (score >= 55) {
      level = "Moderate";
    } else {
      level = "Weak";
    }

    result[name] = { score, level };
  }

  return result;
}

export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      system_scores,    // ej: "Cardio 52, Endo 48, Renal 61"
      weeks_to_exam,    // ej: 4
      hours_per_day,    // ej: 3
      fatigue_level,    // "Low" | "Moderate" | "High"
      resources         // ej: ["UWorld", "Anki", "First Aid"]
    } = req.body || {};

    if (!system_scores) {
      return res.status(400).json({
        error: "Missing 'system_scores' in request body"
      });
    }

    const performance_map = parseSystemScores(system_scores);

    return res.status(200).json({
      ok: true,
      kind: "nbme_analysis_stub",
      performance_map,
      weeks_to_exam: weeks_to_exam ?? null,
      hours_per_day: hours_per_day ?? null,
      fatigue_level: fatigue_level ?? null,
      resources: resources ?? null
    });
  } catch (err) {
    console.error("analyze-nbme error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
}
