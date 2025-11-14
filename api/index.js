const express = require("express");
const app = express();
app.use(express.json());

// Rutas reales del motor
require("./routes/analyze-nbme")(app);
require("./routes/generate-plan")(app);
require("./routes/save-state")(app);
require("./routes/register-student")(app);
require("./routes/get-progress")(app);

// Healthcheck
app.get("/", (req, res) => {
  res.json({ status: "MedStep Engine Backend Running" });
});

// Exportar server como Vercel handler
module.exports = app;
