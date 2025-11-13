export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    return res.status(200).json({
      ok: true,
      message: "Generate plan stub working",
      received: req.body
    });
  } catch (err) {
    console.error("generate-plan error:", err);
    return res.status(500).json({ error: err.message });
  }
}
