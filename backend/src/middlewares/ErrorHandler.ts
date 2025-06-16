import dotenv from 'dotenv';
import { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log('🔥 Error Handler Triggered:', err.message);
  
  let error = err;

  // Convert non-ApiError instances to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || (error.name === 'ValidationError' ? 400 : 500);
    
    error = new ApiError({
      statusCode,
      message: error.message || 'Something went wrong',
      ...(error.errors && { errors: error.errors }),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  // Log the error
  logger.error(`[${error.statusCode}] ${error.message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Send error response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    ...(error.errors?.length && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      path: req.path,
      method: req.method 
    })
  };

  res.status(error.statusCode).json(response);
};

export { errorHandler };