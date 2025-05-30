import logger from "../../src/utils/logger.js";
import mongoose from "mongoose";
import { ApiError } from "../../src/utils/ApiError.js";
import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || "Something went wrong";
    error = new ApiError({ statusCode, message });
  }

  // Log error with Winston
  logger.error("API Error", {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    route: req.originalUrl,
    method: req.method,
  });

  // Send API response
  return res.status(error.statusCode).json({
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
};

export { errorHandler };
