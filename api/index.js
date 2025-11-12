module.exports = async (req, res) => {
  try {
    const data = {
      status: "✅ MedStep Backend is LIVE",
      message: "API is ready to receive requests from Step 1 Booster.",
      available_endpoints: [
        "/api/generate-plan",
        "/api/analyze-nbme",
        "/api/save-state",
        "/api/get-progress"
      ],
      timestamp: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error in index.js:", error);
    res.status(500).json({
      status: "❌ INTERNAL_SERVER_ERROR",
      message: error.message || "Unknown error occurred",
    });
  }
};
