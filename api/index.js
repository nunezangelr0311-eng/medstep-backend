export default async function handler(req, res) {
  try {
    // Confirmar que el endpoint funciona
    const response = {
      status: "✅ MedStep Backend is LIVE (Node Runtime)",
      message: "API is ready to receive requests from Step 1 Booster.",
      available_endpoints: [
        "/api/generate-plan",
        "/api/analyze-nbme",
        "/api/save-state",
        "/api/get-progress"
      ],
      timestamp: new Date().toISOString()
    };

    // Responder correctamente
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error in /api/index.js:", error);
    res.status(500).json({
      status: "❌ INTERNAL_SERVER_ERROR",
      message: error.message || "Unknown error occurred in index.js",
    });
  }
}

