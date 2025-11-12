module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { nbme_text } = req.body;

    if (!nbme_text) {
      return res.status(400).json({ error: "Missing NBME text" });
    }

    return res.status(200).json({
      ok: true,
      systems: {
        Cardio: "Weak",
        Endo: "Weak",
        Renal: "Moderate"
      }
    });
  } catch (err) {
    console.error("Error analyzing NBME:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
