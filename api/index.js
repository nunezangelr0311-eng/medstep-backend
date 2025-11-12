import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serverless from "serverless-http";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🧠 Middleware de autenticación
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ACTIONS_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// 📊 Endpoint 1: Análisis NBME
app.post("/api/analyze-nbme", (req, res) => {
  return res.json({
    received: true,
    type: "nbme-analysis",
    input: req.body,
  });
});

// 🗓️ Endpoint 2: Generar plan de 30 días
app.post("/api/generate-plan", (req, res) => {
  return res.json({
    plan_30_days: ["Day 1: Review weak systems", "Day 2: UWorld blocks"],
    checkpoints: {
      daily: "Complete 40 questions daily",
      weekly: "Full-length test weekly",
    },
  });
});

// 💾 Endpoint 3: Guardar estado
app.post("/api/save-state", (req, res) => {
  return res.json({ saved: true, state: req.body });
});

// 🧩 Endpoint de prueba
app.get("/api/ping", (req, res) => {
  res.json({ message: "✅ MedStep Engine backend is alive and running!" });
});

// 📂 Servir OpenAPI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// 🌐 Endpoint raíz informativo
app.get("/", (req, res) => {
  res.json({
    status: "✅ MedStep Backend is LIVE",
    message: "Serverless API ready to receive requests from Step 1 Booster",
    available_endpoints: [
      "/api/analyze-nbme",
      "/api/generate-plan",
      "/api/save-state",
      "/api/ping",
      "/api/openapi.json"
    ],
    timestamp: new Date().toISOString(),
  });
});

// 🚀 Exportar para Vercel
export const handler = serverless(app);
export default app;
