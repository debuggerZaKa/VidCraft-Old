import { spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..");
const dbPath = path.join(repoRoot, "data", "db");
const MONGO_HOST = "127.0.0.1";
const MONGO_PORT = 27017;

const isMongoUp = () =>
  new Promise((resolve) => {
    const socket = net.connect(MONGO_PORT, MONGO_HOST, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForMongo = async (tries = 60) => {
  for (let i = 0; i < tries; i += 1) {
    if (await isMongoUp()) return true;
    await sleep(500);
  }
  return false;
};

fs.mkdirSync(dbPath, { recursive: true });

let mongod = null;
let startedMongo = false;

if (await isMongoUp()) {
  console.log(`MongoDB already running on ${MONGO_HOST}:${MONGO_PORT}`);
} else {
  console.log(`Starting MongoDB (dbpath: ${dbPath})…`);
  mongod = spawn(
    "mongod",
    ["--dbpath", dbPath, "--bind_ip", MONGO_HOST, "--port", String(MONGO_PORT)],
    {
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
      windowsHide: true,
    }
  );
  startedMongo = true;

  mongod.on("error", (error) => {
    console.error("Failed to start mongod. Is MongoDB installed and on PATH?");
    console.error(error.message);
    process.exit(1);
  });

  mongod.on("exit", (code, signal) => {
    if (!serverExited && code && code !== 0) {
      console.error(`mongod exited unexpectedly (code=${code}, signal=${signal})`);
      process.exit(code || 1);
    }
  });

  if (!(await waitForMongo())) {
    console.error("MongoDB did not become ready on port 27017.");
    if (mongod) mongod.kill();
    process.exit(1);
  }
  console.log(`MongoDB ready on ${MONGO_HOST}:${MONGO_PORT}`);
}

let serverExited = false;
const server = spawn("node", ["src/index.js"], {
  cwd: serverRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
  windowsHide: true,
});

const shutdown = (code = 0) => {
  serverExited = true;
  if (server && !server.killed) server.kill();
  if (startedMongo && mongod && !mongod.killed) {
    mongod.kill();
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

server.on("exit", (code) => {
  serverExited = true;
  if (startedMongo && mongod && !mongod.killed) mongod.kill();
  process.exit(code ?? 0);
});
