import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apiDir = path.resolve(webDir, "../api");
const database = path.join(apiDir, "storage/framework/testing/e2e.sqlite");
const env = {
  ...process.env,
  APP_ENV: "testing",
  APP_DEBUG: "false",
  APP_URL: "http://127.0.0.1:8100",
  FRONTEND_URL: "http://127.0.0.1:3100",
  SANCTUM_STATEFUL_DOMAINS: "127.0.0.1:3100,127.0.0.1:8100",
  DB_CONNECTION: "sqlite",
  DB_DATABASE: database,
  DB_QUEUE_CONNECTION: "sqlite",
  QUEUE_CONNECTION: "database",
  SESSION_DRIVER: "file",
  CACHE_STORE: "array",
  EARTH_ENGINE_SERVICE_URL: "http://127.0.0.1:8199",
  EARTH_ENGINE_TOKEN: "e2e-internal-token-not-for-production",
  E2E_DB_PATH: database,
};

const setup = spawnSync(process.env.PHP_BINARY || "php", ["tests/E2E/bootstrap.php"], {
  cwd: apiDir,
  env,
  stdio: "inherit",
});

if (setup.status !== 0) process.exit(setup.status ?? 1);

const server = spawn(process.env.PHP_BINARY || "php", ["-S", "127.0.0.1:8100", "-t", "public", "public/index.php"], {
  cwd: apiDir,
  env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code) => process.exit(code ?? 0));
