export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing JSON body" });
    }

    return res.status(200).json({
      ok: true,
      received: body,
      message: "NBME analysis stub working"
    });
  } catch (error) {
    console.error("Analyze NBME error:", error);
    return res.status(500).json({ error: error.message });
  }
}
