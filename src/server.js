import app from "./app.js";
import env from "./config/env.js";
import { closeDatabase, testDatabaseConnection } from "./config/db.js";

let server;

const startServer = async () => {
  try {
    await testDatabaseConnection();
    console.log("Conexion a base de datos verificada correctamente.");

    server = app.listen(env.port, () => {
      // Mensaje util para identificar rapido ambiente y version de API.
      console.log(
        env.apiName +
          " (" +
          env.apiVersion +
          ") escuchando en puerto " +
          env.port +
          " [" +
          env.nodeEnv +
          "]",
      );
    });
  } catch (error) {
    console.error(
      "No se pudo establecer conexion inicial con la base de datos.",
    );
    console.error(error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log("\nRecibida senal " + signal + ". Cerrando servidor...");

  if (server) {
    server.close(async () => {
      await closeDatabase();
      console.log("Servidor cerrado correctamente.");
      process.exit(0);
    });
    return;
  }

  await closeDatabase();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
