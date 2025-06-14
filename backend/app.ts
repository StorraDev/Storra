import express from 'express';

const app = express();

import healthcheckRouter from './src/HealthCheck/healthcheck.route.js';
import cookieParser from 'cookie-parser';

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Health check route
app.use("/api/v1", healthcheckRouter);
export { app };
