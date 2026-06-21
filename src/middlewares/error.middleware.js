import { HttpError } from "../utils/http-error.js";
import env from "../config/env.js";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err.message || "Error interno del servidor";

  const response = {
    status: "error",
    message,
  };

  if (err instanceof HttpError && err.details) {
    response.details = err.details;
  }

  if (env.isDevelopment) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;
