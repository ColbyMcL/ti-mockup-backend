const express = require("express");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const BACKEND_SECRET = process.env.BACKEND_SECRET || "ti_mockup_pilot_2026_supersecret_abc123";

app.get("/", (req, res) => {
  res.send("TI mockup backend is running.");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/create-mockup", (req, res) => {
  const providedSecret = req.header("x-backend-secret");

  if (providedSecret !== BACKEND_SECRET) {
    return res.status(401).json({
      ok: false,
      error: "unauthorized"
    });
  }

  const body = req.body || {};

  console.log("=== NEW MOCKUP JOB ===");
  console.log(JSON.stringify(body, null, 2));

  return res.json({
    ok: true,
    status: "queued",
    job_id: body.job_id || "",
    message: "Mockup job received by Railway backend."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});