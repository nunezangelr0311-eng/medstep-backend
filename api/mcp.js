module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
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
    }

    if (req.method === "POST") {
      return res.status(200).json({
        ok: true,
        received: req.body
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("MCP ERROR:", err);
    res.status(500).json({ error: "MCP crash" });
  }
};
