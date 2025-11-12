module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST for registration." });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    return res.status(200).json({
      ok: true,
      message: "Student registered",
      email
    });
  } catch (err) {
    console.error("Error registering:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
