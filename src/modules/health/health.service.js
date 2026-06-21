import env from "../../config/env.js";
import { testDatabaseConnection } from "../../config/db.js";

const getHealthStatus = () => {
  return {
    status: "ok",
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  };
};

const getDatabaseHealthStatus = async () => {
  try {
    await testDatabaseConnection();

    return {
      status: "ok",
      message: "Conexion a base de datos operativa",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      message: "No hay conexion con la base de datos",
      timestamp: new Date().toISOString(),
      details: error.message,
    };
  }
};

export { getHealthStatus, getDatabaseHealthStatus };
