export default async function handler(req, res) {
  try {
    return res.status(200).json({
      message: "✅ Test endpoint working",
      time: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error in test.js",
      details: error.message
    });
  }
}

