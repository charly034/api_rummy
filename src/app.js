import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import notFoundMiddleware from "./middlewares/not-found.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

const corsOptions = env.corsOrigin
  ? {
      origin: env.corsOrigin,
      credentials: true,
    }
  : {};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Demasiadas solicitudes, intenta nuevamente en unos minutos.",
  },
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use(morgan(env.isDevelopment ? "dev" : "combined"));

app.use("/api/v1", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
