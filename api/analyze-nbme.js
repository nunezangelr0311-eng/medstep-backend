// api/analyze-nbme.js

module.exports = function (app) {
  app.post("/api/analyze-nbme", async (req, res) => {
    try {
      const body = req.body;

      // Validación mínima
      if (!body) {
        return res.status(400).json({ error: "Missing JSON body" });
      }

      // Stub de prueba: solo devuelve lo que recibe
      return res.json({
        ok: true,
        kind: "nbme_analysis_stub",
        received: body
      });
    } catch (err) {
      console.error("Analyze NBME error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // (opcional) si alguien hace GET a /api/analyze-nbme, respondemos 405
  app.get("/api/analyze-nbme", (req, res) => {
    return res.status(405).json({ error: "Method not allowed" });
  });
};
