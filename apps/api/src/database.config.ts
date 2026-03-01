/**
 * Build Sequelize connection options from DATABASE_URL or individual env vars.
 */
export function getSequelizeOptions() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        dialect: 'postgres' as const,
        host: parsed.hostname,
        port: parseInt(parsed.port || '5432', 10),
        username: parsed.username,
        password: parsed.password,
        database: parsed.pathname.slice(1) || 'shiftsync',
      };
    } catch {
      // fall through to env vars
    }
  }
  return {
    dialect: 'postgres' as const,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'shiftsync',
    password: process.env.DATABASE_PASSWORD ?? 'shiftsync',
    database: process.env.DATABASE_NAME ?? 'shiftsync',
  };
}
