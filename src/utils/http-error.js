class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const createHttpError = (statusCode, message, details = null) => {
  return new HttpError(statusCode, message, details);
};

export { HttpError, createHttpError };
