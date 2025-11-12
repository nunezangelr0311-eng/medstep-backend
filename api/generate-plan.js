module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { email, nbme_text, weeks, hours_per_day, fatigue_level, resources } = req.body;

    if (!email || !nbme_text) {
      return res.status(400).json({ error: "Missing required fields: email or nbme_text" });
    }

    const response = {
      plan_cycle: [
        {
          week: 1,
          days: [
            {
              day: 1,
              focus: "Endocrine review and UWorld QBank practice",
              tasks: [
                "Do 25 Endocrine UWorld questions timed",
                "Review explanations and note errors",
                "Anki flashcards for Endo"
              ],
              hours: 3
            }
          ]
        }
      ],
      daily_checkpoint: [
        { day: 1, reflection: "What endocrine topic confused you today?" }
      ],
      weekly_objectives: [
        { week: 1, goal: "Stabilize weak systems and maintain consistency" }
      ],
      updated_state: {
        performance_map: { Cardio: "Weak", Endo: "Weak", Renal: "Moderate" },
        fatigue_level: fatigue_level || "Moderate",
        weeks_to_exam: weeks || 4,
        hours_per_day: hours_per_day || 3
      }
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error generating plan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
