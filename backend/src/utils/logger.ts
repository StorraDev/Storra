import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),  // <- important to capture error stack
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "your-service-name" }, // optional meta info
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === "development"
        ? format.combine(format.colorize(), format.simple())
        : format.json()
    }),
    // Optionally add file transports here for error logs or combined logs
  ],
});

export default logger;
