export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.status(200).json({
    "mcp:version": "1.0",
    "name": "medstep_engine_mcp",
    "tools": [
      {
        "name": "analyze_nbme",
        "description": "Analyze NBME input JSON",
        "inputSchema": {
          "type": "object",
          "properties": {
            "json": { "type": "string" }
          },
          "required": ["json"]
        }
      },
      {
        "name": "generate_plan",
        "description": "Generate a 30-day plan",
        "inputSchema": {
          "type": "object",
          "properties": {
            "json": { "type": "string" }
          },
          "required": ["json"]
        }
      },
      {
        "name": "save_state",
        "description": "Save student state JSON",
        "inputSchema": {
          "type": "object",
          "properties": {
            "json": { "type": "string" }
          },
          "required": ["json"]
        }
      }
    ]
  });
}
