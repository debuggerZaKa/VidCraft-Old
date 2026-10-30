import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateHfVideo, getVideoConfig, getVideoToken } from "../src/hfVideo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const logPath = path.resolve(__dirname, "test-hf-video.log");
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logPath, `${line}\n`);
};

const prompt =
  process.argv.slice(2).join(" ").trim() ||
  "A cat walking slowly through a sunny garden, cinematic camera movement";

const keepAlive = setInterval(() => log("still running..."), 10000);

async function main() {
  fs.writeFileSync(logPath, "");
  const token = getVideoToken();
  const config = getVideoConfig();

  log("HF video smoke test");
  log(`token: ${token ? `${token.slice(0, 8)}...` : "(missing)"}`);
  log(`model: ${config.model}`);
  log(`provider: ${config.provider}`);
  log(`frames: ${config.numFrames} (~${config.seconds}s)`);
  log(`steps: ${config.numInferenceSteps}`);
  log(`prompt: ${prompt}`);
  log("Starting generation...");

  const result = await generateHfVideo(prompt);
  const outPath = path.resolve(__dirname, "test-video.mp4");
  const base64 = result.videoDataUrl.split(",")[1];
  fs.writeFileSync(outPath, Buffer.from(base64, "base64"));

  log("SUCCESS");
  log(`saved: ${outPath}`);
  log(`size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
  log(`provider: ${result.provider}`);
}

main()
  .catch((error) => {
    log(`FAILED: ${error?.message || error}`);
    if (error?.stack) log(error.stack);
    process.exitCode = 1;
  })
  .finally(() => {
    clearInterval(keepAlive);
  });
