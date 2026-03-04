/**
 * Sequelize CLI config.
 *
 * Note: This file is consumed by `sequelize-cli` (CommonJS).
 * It reads DATABASE_URL from the environment.
 */
const { loadEnv } = require("../common/env/loadEnv");

// sequelize-cli does NOT load `.env` automatically.
loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Keep this explicit so `db:migrate` fails fast with a clear message.
  throw new Error("DATABASE_URL is required for sequelize-cli");
}

module.exports = {
  development: {
    url: databaseUrl,
    dialect: "postgres",
    seederStorage: "sequelize",
  },
  test: {
    url: databaseUrl,
    dialect: "postgres",
    seederStorage: "sequelize",
  },
  production: {
    url: databaseUrl,
    dialect: "postgres",
    seederStorage: "sequelize",
  },
};
