// api/test.js
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    message: "MedStep Engine test endpoint is alive 🚀"
  });
};
