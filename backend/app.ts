import express from 'express';
import { errorHandler } from './src/middlewares/ErrorHandler.js'
const app = express();

import healthcheckRouter from './src/HealthCheck/healthcheck.route.js';
import countryRouter from './src/Country/countryRoute.js'
import schoolRouter from './src/School/schoolRoute.js';
import cookieParser from 'cookie-parser';

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Health check route
app.use("/api/v1", healthcheckRouter);
app.use("/api/v1/country", countryRouter);
app.use("/api/v1/school", schoolRouter);

app.use( errorHandler )
export { app };
