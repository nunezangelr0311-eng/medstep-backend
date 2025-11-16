const express = require("express");
const app = express();

app.use(express.json());

// Rutas reales del motor (SIN /routes/)
require("./analyze-nbme")(app);
require("./generate-plan")(app);
require("./save-state")(app);
require("./register-student")(app);
require("./get-progress")(app);

// Healthcheck
app.get("/", (req, res) => {
  res.json({ status: "MedStep Engine Backend Running" });
});

// Exportar server como Vercel handler
module.exports = app;
