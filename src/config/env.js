import path from "path";
import dotenv from "dotenv";

// Carga variables de entorno desde .env en la raiz del proyecto.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const toBoolean = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return value === "true";
};

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiName: process.env.API_NAME || "API Base",
  apiVersion: process.env.API_VERSION || "v1",
  corsOrigin: process.env.CORS_ORIGIN || "",
  jwtSecret: process.env.JWT_SECRET || "",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
  database: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    ssl: toBoolean(process.env.DB_SSL, false),
    sslRejectUnauthorized: toBoolean(
      process.env.DB_SSL_REJECT_UNAUTHORIZED,
      true,
    ),
    poolMax: Number(process.env.DB_POOL_MAX) || 10,
    connectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 5000,
    idleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
    sslMode: process.env.PGSSLMODE || "disable",
  },
};

export default env;
