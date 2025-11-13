// api/index.js
const express = require("express");
const app = express();

// Necesario para leer JSON
app.use(express.json());

// Cargar rutas
require("./analyze-nbme")(app);
require("./generate-plan")(app);
require("./save-state")(app);
require("./register-student")(app);
require("./get-progress")(app);
require("./mcp")(app);

// Healthcheck
app.get("/", (req, res) => {
  res.json({ status: "MedStep Engine Backend Running" });
});

module.exports = app;
