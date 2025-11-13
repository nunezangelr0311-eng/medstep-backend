export default async function handler(req, res) {
  // --- CORS FIX ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- MCP SERVER JSON ---
  if (req.method === "GET") {
    return res.status(200).json({
      version: "1.0.0",
      metadata: {
        name: "MedStep Engine MCP"
      },
      tools: [
        {
          name: "analyze_nbme",
          description: "Analyze NBME input JSON",
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

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      received: req.body
    });
  }

  res.status(405).json({ error: "Method not allowed" });
}
