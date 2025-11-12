// api/analyze-nbme.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function readBearer(req) {
  const h = req.headers["authorization"] || "";
  const parts = h.split(" ");
  return parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : "";
}

function parseNBMEText(nbmeText = "") {
  const map = {};
  nbmeText
    .split(",")
    .map((s) => s.trim())
    .forEach((pair) => {
      const m = pair.match(/^(.+?)\s+(\d{2,3})$/);
      if (m) {
        const sys = m[1].trim();
        const val = parseInt(m[2], 10);
        map[sys] = val;
      }
    });
  return map;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = readBearer(req);
    const expected = process.env.ACTIONS_SECRET || "MedStep2025SecureToken";
    if (token !== expected) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body || {};
    const {
      email = "student@example.com",
      nbme_text = "",
      weeks = 4,
      hours_per_day = 3,
      return_format = "markdown",
      timezone = "America/Puerto_Rico",

      // NUEVOS (opcionales)
      fatigue_level = "medium",         // "low" | "medium" | "high"
      max_focus_minutes,                // si no se envía, lo calculamos por fatiga
      rest_days_per_week = 1,           // 0..2
      use_pomodoro = true               // descansos automáticos
    } = body;

    const scores = parseNBMEText(nbme_text);

    // Derivar defaults por fatiga si no te pasan max_focus_minutes
    const focusMap = { low: 50, medium: 40, high: 25 };
    const computedMaxFocus =
      typeof max_focus_minutes === "number" && max_focus_minutes > 10
        ? max_focus_minutes
        : focusMap[(String(fatigue_level) || "medium").toLowerCase()] || 40;

    const systemPrompt = `
You are MedStep Engine — Step 1 coach. Act as a demanding but compassionate attending.
Turn NBME scores into an operational day-by-day plan with **fatigue-aware scheduling**.

Global rules (non-negotiable):
- Prioritize weak systems first; retain at least a minimal thread for strong systems.
- Every day must include: study blocks + UWorld + review + flashcards.
- Respect fatigue controls:
  • Max focus minutes per block = ${computedMaxFocus}
  • Insert short breaks (5–10 min) between blocks; if use_pomodoro=true, follow 25/5 or 40/10 cycles.
  • Schedule ${rest_days_per_week} recovery/light day(s) per week (lower intensity, no heavy new content).
  • Cap daily active hours at ~${hours_per_day} (±15 min), never exceed by >30 min.
- Include weekly checkpoint with **fatigue reflection** (sleep, headaches, focus quality) and
  automatic rebalancing (reduce block length, increase breaks, or add light day) if fatigue worsens.
- Safe resources only (e.g., First Aid, UWorld, Anki/Sketchy).
- If structured JSON is requested, return ONLY valid JSON (no prose).
`;

    const jsonTemplate = {
      plan_meta: {
        weeks,
        hours_per_day,
        timezone,
        fatigue_protocol: {
          fatigue_level,
          max_focus_minutes: computedMaxFocus,
          rest_days_per_week,
          use_pomodoro,
          rules: [
            "Insert 5–10 min breaks between blocks; longer 20 min break every 90 min.",
            "If RPE ≥ 7/10 for 2 straight days, shorten blocks by 5–10 min and add 1 extra light block.",
            "One recovery/light day per week defaults to spaced review + flashcards + gentle UWorld.",
          ],
        },
      },
      summary: {
        weak_systems: [],
        moderate_systems: [],
        strong_systems: [],
        rationale: "",
      },
      weeks: [
        // {
        //   week: 1,
        //   total_hours: 0,
        //   days: [
        //     {
        //       day: "Mon",
        //       target_hours: hours_per_day,
        //       notes: "Light day if high fatigue",
        //       blocks: [
        //         { type: "study", minutes: 40, topic: "Endocrine — thyroid", activity: "Study + notes", resources: ["First Aid Endocrine"] },
        //         { type: "review", minutes: 20, topic: "Yesterday wrongs", activity: "Error log", resources: [] },
        //       ],
        //       uworld: { qbank: "UWorld", mode: "Tutor", questions: 40, review_minutes: 30 },
        //       flashcards: { minutes: 20, deck: "Anki Endo Core" },
        //       breaks: { short_breaks: 3, long_breaks: 1, schema: "Pomodoro 40/10" }
        //     },
        //     {
        //       day: "Sun",
        //       target_hours: 2,
        //       blocks: [{ type: "recovery", minutes: 60, activity: "Spaced review + light cardio walk" }],
        //       uworld: { questions: 20, review_minutes: 20 },
        //       flashcards: { minutes: 15 }
        //     }
        //   ]
        // }
      ],
      checkpoints: [
        // { when: "end_of_week_1", tasks: ["NBME mini 50q", "Fatigue RPE survey", "Adjust block length if RPE>=7"] }
      ],
      pearls: [],
    };

    const useJSON = String(return_format).toLowerCase() === "structured_plan_v2";

    const userPromptStructured = `
NBME raw text: ${nbme_text}

Parsed scores: ${JSON.stringify(scores)}

Student constraints:
- weeks: ${weeks}
- hours_per_day: ${hours_per_day}
- timezone: ${timezone}

Fatigue controls:
- fatigue_level: ${fatigue_level}
- max_focus_minutes: ${computedMaxFocus}
- rest_days_per_week: ${rest_days_per_week}
- use_pomodoro: ${use_pomodoro}

Return STRICT JSON following this schema:
${JSON.stringify(jsonTemplate, null, 2)}

Extra constraints:
- Distribute rest/recovery day(s) realistically (e.g., midweek or weekend).
- For "breaks", provide counts and the schema used (e.g., "Pomodoro 25/5" or "90/20").
- Ensure each day totals ≈ ${hours_per_day} hours (± 15 min).
- Include “checkpoints” with fatigue reflection and explicit auto-adjust rules for next week.
`;

    const userPromptMarkdown = `
NBME raw text: ${nbme_text}

Student constraints:
- weeks: ${weeks}
- hours_per_day: ${hours_per_day}
- timezone: ${timezone}

Fatigue controls:
- fatigue_level: ${fatigue_level}, max_focus_minutes: ${computedMaxFocus}, rest_days_per_week: ${rest_days_per_week}, use_pomodoro: ${use_pomodoro}

Produce a concise but complete markdown plan including:
- **Weak vs Strong** triage + rationale.
- **Day-by-day** schedule with block durations capped at ${computedMaxFocus} min, breaks (Pomodoro/90-20), UWorld, review y flashcards.
- **Recovery/light day(s)** cada semana.
- **Weekly checkpoints** con fatiga (RPE) y reglas de autoajuste para la semana siguiente.
Use clear headings and bullets.
`;

    const messages = [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: (useJSON ? userPromptStructured : userPromptMarkdown).trim() },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages,
      ...(useJSON ? { response_format: { type: "json_object" } } : {}),
    });

    const content = completion.choices?.[0]?.message?.content || "";

    if (useJSON) {
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        parsed = {
          plan_meta: {
            weeks,
            hours_per_day,
            timezone,
            fatigue_protocol: {
              fatigue_level,
              max_focus_minutes: computedMaxFocus,
              rest_days_per_week,
              use_pomodoro,
              rules: ["Model returned non-JSON; showing raw content."],
            },
          },
          summary: { weak_systems: [], moderate_systems: [], strong_systems: [], rationale: "Fallback." },
          weeks: [],
          checkpoints: [],
          pearls: [],
          raw: content,
        };
      }

      res.status(200).json({
        email,
        plan: parsed,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      email,
      result: content,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("analyze-nbme error:", err);
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "INTERNAL";
    res.status(500).json({ error: "INTERNAL", detail: msg });
  }
};
