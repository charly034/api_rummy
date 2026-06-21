import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const getSslConfig = () => {
  if (!env.database.ssl) return false;

  return {
    rejectUnauthorized: env.database.sslRejectUnauthorized,
  };
};

const createPool = () => {
  const baseConfig = {
    max: env.database.poolMax,
    connectionTimeoutMillis: env.database.connectionTimeoutMs,
    idleTimeoutMillis: env.database.idleTimeoutMs,
    ssl: getSslConfig(),
  };

  if (env.database.url) {
    return new Pool({
      connectionString: env.database.url,
      ...baseConfig,
    });
  }

  return new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    ...baseConfig,
  });
};

const pool = createPool();

const testDatabaseConnection = async () => {
  await pool.query("SELECT 1");
};

const closeDatabase = async () => {
  await pool.end();
};

export { pool, testDatabaseConnection, closeDatabase };
