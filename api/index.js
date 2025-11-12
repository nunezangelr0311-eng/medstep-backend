export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const data = {
      status: "✅ MedStep Backend is LIVE (EDGE MODE)",
      message: "API is ready to receive requests from Step 1 Booster.",
      available_endpoints: [
        "/api/generate-plan",
        "/api/analyze-nbme",
        "/api/save-state",
        "/api/get-progress",
      ],
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = {
      status: "❌ INTERNAL_SERVER_ERROR",
      message: error.message || "Unknown error occurred",
    };
    return new Response(JSON.stringify(err), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
