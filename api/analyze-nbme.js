module.exports = function (app) {
  app.post("/api/analyze-nbme", async (req, res) => {
    try {
      const body = req.body;

      // Validación mínima
      if (!body) {
        return res.status(400).json({ error: "Missing JSON body" });
      }

      res.json({
        ok: true,
        kind: "nbme_analysis_stub",
        received: body
      });
    } catch (err) {
      console.error("Analyze NBME error:", err);
      res.status(500).json({ error: err.message });
    }
  });
};
