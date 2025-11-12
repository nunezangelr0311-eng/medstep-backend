export default function handler(req, res) {
  try {
    return res.status(200).json({
      status: "✅ MedStep Backend is LIVE",
      message: "API is ready to receive requests from Step 1 Booster.",
      available_endpoints: [
        "/api/generate-plan",
        "/api/analyze-nbme",
        "/api/save-state",
        "/api/get-progress"
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in index.js:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
