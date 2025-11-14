// api/mcp.js

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Manifiesto MCP que verá el Agent Builder
  res.status(200).json({
    "mcp:version": "1.0",              // 👈 clave para el Agent Builder
    version: "1.0.0",
    metadata: {
      name: "MedStep Engine MCP"
    },
    tools: [
      {
        name: "analyze_nbme",
        description: "Analyze NBME JSON input",
        inputSchema: {
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
        inputSchema: {
          type: "object",
          properties: {
            json: { type: "string" }
          },
          required: ["json"]
        }
      },
      {
        name: "save_state",
        description: "Save student state JSON",
        inputSchema: {
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
