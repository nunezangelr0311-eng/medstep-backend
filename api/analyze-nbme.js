// Versión ultra simple en CommonJS para evitar cualquier problema de ESM.

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).json({ info: "MedStep analyze-nbme endpoint alive (use POST)." });
    }

    return res.status(200).json({
      status: "ok",
      message: "MedStep Engine test OK",
      method: req.method
    });
  } catch (err) {
    console.error("Minimal handler error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
};
