import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { logger } from "./lib/logger";

const envPaths = [
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "artifacts", "api-server", ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
  if (process.env.DATABASE_URL) {
    break;
  }
}

const { default: app } = await import("./app");

const port = Number(process.env["PORT"] ?? "5000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
