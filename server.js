const express = require("express");
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const BACKEND_SECRET =
  process.env.BACKEND_SECRET || "ti_mockup_pilot_2026_supersecret_abc123";

app.get("/", (req, res) => {
  res.send("TI mockup backend is running.");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/create-mockup", async (req, res) => {
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

  if (!body.job_id) {
    return res.status(400).json({
      ok: false,
      error: "missing job_id"
    });
  }

  if (!body.source_image_url) {
    return res.status(400).json({
      ok: false,
      error: "missing source_image_url"
    });
  }

  res.json({
    ok: true,
    status: "queued",
    job_id: body.job_id || "",
    message: "Mockup job received by Railway backend."
  });

  try {
    console.log("Starting processing for job:", body.job_id);

    const localImagePath = await downloadSlackImage(
      body.source_image_url,
      body.job_id
    );

    console.log("Download complete for job:", body.job_id);
    console.log("Local image path:", localImagePath);

    const mockupPath = await generateMockup(localImagePath, body.job_id);

    console.log("Mockup created for job:", body.job_id);
    console.log("Mockup output path:", mockupPath);

  } catch (err) {
    console.error("Mockup job failed for:", body.job_id);
    console.error(err && err.stack ? err.stack : err);
  }
});

console.log("Has SLACK_BOT_TOKEN:", !!process.env.SLACK_BOT_TOKEN);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

async function downloadSlackImage(url, jobId) {
  const slackBotToken = process.env.SLACK_BOT_TOKEN;

  if (!slackBotToken) {
    throw new Error("Missing SLACK_BOT_TOKEN environment variable");
  }

  console.log("Downloading Slack image for job:", jobId);

  const response = await axios({
    url: url,
    method: "GET",
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${slackBotToken}`
    }
  });

  const path = `/tmp/${jobId}.jpg`;
  const writer = fs.createWriteStream(path);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log("Image saved:", path);
      resolve(path);
    });
    writer.on("error", reject);
  });
}

async function generateMockup(imagePath, jobId) {
  const outputPath = `/tmp/${jobId}_mockup.jpg`;

  await sharp(imagePath)
    .modulate({
      saturation: 0.2,
      brightness: 0.9
    })
    .tint("#111111")
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  return outputPath;
}