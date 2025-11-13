// api/mcp.js
module.exports = function (app) {
  // ✅ GET: usado por ChatGPT para descubrir las tools disponibles
  app.get("/api/mcp", (req, res) => {
    res.json({
      mcp: "MedStep Engine",
      tools: [
        {
          name: "analyze_nbme",
          description: "Analyze NBME input JSON",
          parameters: {
            type: "object",
            properties: {
              json: { type: "string" }
            },
            required: ["json"]
          }
        },
        {
          name: "generate_plan",
          description: "Generate a 30-day plan",
          parameters: {
            type: "object",
            properties: {
              json: { type: "string" }
            },
            required: ["json"]
          }
        },
        {
          name: "save_state",
          description: "Save student state",
          parameters: {
            type: "object",
            properties: {
              json: { type: "string" }
            },
            required: ["json"]
          }
        }
      ]
    });
  });

  // ✅ POST: ChatGPT ejecuta una tool y te envía el payload
  app.post("/api/mcp", async (req, res) => {
    try {
      // Por ahora solo eco para probar que funciona
      res.json({
        ok: true,
        received: req.body
      });
    } catch (err) {
      console.error("MCP error:", err);
      res.status(500).json({ error: err.message });
    }
  });
};
