// api/mcp.js

module.exports = function (app) {
  // DISCOVERY: ChatGPT hace GET para saber qué herramientas existen
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
          description: "Generate adaptive plan",
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

  // EXECUTION: ChatGPT hace POST aquí cuando ejecuta una tool
  app.post("/api/mcp", async (req, res) => {
    try {
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
