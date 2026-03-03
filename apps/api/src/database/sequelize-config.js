/**
 * Sequelize CLI config (used for migrations). Reads DATABASE_URL or env vars.
 */
function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        username: parsed.username,
        password: parsed.password,
        database: parsed.pathname.slice(1) || "shiftsync",
        host: parsed.hostname,
        port: parseInt(parsed.port || "5432", 10),
        dialect: "postgres",
      };
    } catch (_) {
      // fall through
    }
  }

  return {
    username: process.env.DATABASE_USER ?? "shiftsync",
    password: process.env.DATABASE_PASSWORD ?? "shiftsync",
    database: process.env.DATABASE_NAME ?? "shiftsync",
    host: process.env.DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432", 10),
    dialect: "postgres",
  };
}

module.exports = {
  development: getConfig(),
  test: getConfig(),
  production: getConfig(),
};
