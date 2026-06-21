import { createHttpError } from "../utils/http-error.js";

const notFoundMiddleware = (req, res, next) => {
  next(createHttpError(404, "Ruta no encontrada: " + req.originalUrl));
};

export default notFoundMiddleware;
