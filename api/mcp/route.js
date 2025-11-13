// api/mcp/route.js

export async function GET() {
  return Response.json({
    mcp: "1.0",
    tools: [
      {
        name: "ANALYZE_NBME",
        description: "Analyze NBME system scores and classify each system.",
        inputSchema: {
          type: "object",
          properties: {
            scores: {
              type: "object",
              description:
                "Map of system name -> numeric score, e.g. { Cardio: 52, Endo: 48 }",
            },
          },
          required: ["scores"],
          additionalProperties: false,
        },
      },
      {
        name: "GENERATE_PLAN",
        description: "Generate an adaptive NBME study plan.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "object",
              description:
                "Student state including performance_map, fatigue_level, weeks_to_exam, hours_per_day.",
            },
          },
          required: ["state"],
          additionalProperties: false,
        },
      },
      {
        name: "SAVE_STATE",
        description: "Persist the updated student state.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "object",
              description:
                "The updated state after generating a new study plan.",
            },
          },
          required: ["state"],
          additionalProperties: false,
        },
      },
    ],
  });
}

// OPTIONAL: Reject all other methods
export async function POST() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
