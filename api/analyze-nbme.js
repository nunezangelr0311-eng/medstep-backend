// Endpoint mínimo para probar que la función serverless funciona.
// Sin OpenAI, sin imports, solo lógica básica.

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    const valid =
      process.env.MEDSTEP_API_TOKEN || process.env.ACTIONS_SECRET;

    if (!token || !valid || token !== valid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { email, nbme_text } = req.body || {};
    if (!email || !nbme_text) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    return res.status(200).json({
      email,
      result: `MedStep Engine test OK. Received: ${nbme_text}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Analyze-nbme minimal error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
}
