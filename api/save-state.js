module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const state = req.body;

    return res.status(200).json({
      ok: true,
      saved_state: state
    });
  } catch (err) {
    console.error("Error saving state:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
