module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  try {
    return res.status(200).json({
      progress: {
        completed_weeks: 1,
        current_week: 2,
        fatigue_level: "Moderate"
      }
    });
  } catch (err) {
    console.error("Error getting progress:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
