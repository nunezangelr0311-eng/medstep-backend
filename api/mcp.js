export default async function handler(req, res) {
  // MCP requires POST only
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body;

    // MCP ALWAYS sends { method: "...", params: {...} }
    const method = body?.method;
    const params = body?.params || {};

    // ---- MCP COMMAND: LIST TOOLS ----
    if (method === "tools/list") {
      return res.json({
        tools: [
          {
            name: "ANALYZE_NBME",
            description: "Analyze NBME system scores",
            inputSchema: { type: "object" },
          },
          {
            name: "GENERATE_PLAN",
            description: "Generate an adaptive plan",
            inputSchema: { type: "object" },
          },
          {
            name: "SAVE_STATE",
            description: "Save updated state",
            inputSchema: { type: "object" },
          },
        ],
      });
    }

    // ---- MCP COMMAND: CALL TOOL ----
    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      // ANALYZE_NBME
      if (toolName === "ANALYZE_NBME") {
        const resp = await fetch(
          `${process.env.VERCEL_URL
            ? "https://" + process.env.VERCEL_URL
            : "https://medstep-backend.vercel.app"
          }/api/analyze-nbme`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolArgs),
          }
        ).then(r => r.json());

        return res.json({ output: resp });
      }

      // GENERATE_PLAN
      if (toolName === "GENERATE_PLAN") {
        const resp = await fetch(
          `${process.env.VERCEL_URL
            ? "https://" + process.env.VERCEL_URL
            : "https://medstep-backend.vercel.app"
          }/api/generate-plan`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolArgs),
          }
        ).then(r => r.json());

        return res.json({ output: resp });
      }

      // SAVE_STATE
      if (toolName === "SAVE_STATE") {
        const resp = await fetch(
          `${process.env.VERCEL_URL
            ? "https://" + process.env.VERCEL_URL
            : "https://medstep-backend.vercel.app"
          }/api/save-state`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolArgs),
          }
        ).then(r => r.json());

        return res.json({ output: resp });
      }

      // TOOL NOT FOUND
      return res.status(400).json({
        error: `Tool '${toolName}' not recognized`,
      });
    }

    // UNKNOWN MCP METHOD
    return res.status(400).json({
      error: `Unsupported MCP method: ${method}`,
    });

  } catch (err) {
    console.error("MCP ERROR:", err);
    return res.status(500).json({
      error: "Internal MCP error",
      detail: err.message,
    });
  }
}
