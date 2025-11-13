// api/index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔥 Rutas principales del backend
require("./analyze-nbme")(app);
require("./generate-plan")(app);
require("./save-state")(app);
require("./get-progress")(app);
require("./register-student")(app);

// 🔥 MCP SERVER (tu archivo actual)
require("./mcp")(app);

// Ruta base de salud
app.get("/api", (req, res) => {
  res.json({ status: "MedStep Engine Backend Running" });
});

// Exportar para Vercel
module.exports = app;
