export default async function handler(req, res) {
  try {
    // Asegura que la función responda siempre aunque algo falle internamente
    const info = {
      status: "✅ MedStep Backend is LIVE",
      message: "API is ready to receive requests from Step 1 Booster.",
      available_endpoints: [
        "/api/generate-plan",
        "/api/analyze-nbme",
        "/api/save-state",
        "/api/get-progress"
      ],
      environment: process.env.VERCEL_ENV || "production",
      timestamp: new Date().toISOString()
    };

    res.setHeader("Content-Type", "application/json");
    return res.status(200).end(JSON.stringify(info, null, 2));
  } catch (error) {
    console.error("⚠️ Error in index.js handler:", error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).end(
      JSON.stringify({
        status: "❌ Internal Server Error",
        error: error.message,
        hint: "Likely syntax or response formatting issue."
      })
    );
  }
}
