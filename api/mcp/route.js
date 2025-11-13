export const runtime = "edge";

export async function POST(req) {
  try {
    const body = await req.json();

    return new Response(JSON.stringify({
      mcp: "1.0",
      tools: [
        {
          name: "ANALYZE_NBME",
          description: "Analyze NBME system scores.",
          inputSchema: {
            type: "object",
            properties: {
              scores: { type: "object" }
            },
            required: ["scores"]
          }
        },
        {
          name: "GENERATE_PLAN",
          description: "Generate adaptive study plan.",
          inputSchema: {
            type: "object",
            properties: {
              state: { type: "object" }
            },
            required: ["state"]
          }
        },
        {
          name: "SAVE_STATE",
          description: "Save updated study state.",
          inputSchema: {
            type: "object",
            properties: {
              state: { type: "object" }
            },
            required: ["state"]
          }
        }
      ]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "MCP initialization failed",
      details: err.toString()
    }), {
      status: 500
    });
  }
}
