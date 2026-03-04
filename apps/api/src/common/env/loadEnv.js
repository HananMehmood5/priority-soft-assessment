/**
 * Loads local env files for non-Nest runtimes (sequelize-cli, scripts, etc.).
 *
 * NestJS loads `.env` via `@nestjs/config` when the app boots, but tools like
 * `sequelize-cli` run outside Nest and won't automatically load env vars.
 */
"use strict";

const path = require("node:path");
const dotenv = require("dotenv");

function loadEnv(options = {}) {
  const baseDir = options.baseDir || path.resolve(__dirname, "../../../");

  // Prefer `.env.local` overrides. Don't override already-set environment vars.
  const envPath = path.resolve(baseDir, ".env");
  const envLocalPath = path.resolve(baseDir, ".env.local");

  const baseResult = dotenv.config({ path: envPath, override: false });
  const localResult = dotenv.config({ path: envLocalPath, override: false });

  // Basic runtime signal that env loading ran and which files were found.
  if (baseResult.error) {
    // Missing .env is not fatal; many scripts may rely only on process.env.
    // eslint-disable-next-line no-console
    console.log(`[loadEnv] No .env file found at ${envPath}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[loadEnv] Loaded env from ${envPath}`);
  }

  if (!localResult.error && localResult.parsed && Object.keys(localResult.parsed).length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[loadEnv] Loaded overrides from ${envLocalPath} (${Object.keys(localResult.parsed).length} keys)`
    );
  }
}

module.exports = { loadEnv };
