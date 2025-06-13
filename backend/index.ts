import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./src/config/db/db.js";
import { connectRedis} from './src/config/redis/redis';
import { initCountryCounter } from './src/config/redis/redisCountryCounter';
import { initSchoolCounter, getNextSchoolCounter } from './src/config/redis/redisSchoolCounter';
import {initStudentCounter, getNextStudentCounter} from './src/config/redis/redisStudentCounter';
import { logger } from "./src/utils/logger.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({path: join(__dirname, ".env")});

const PORT = process.env.PORT || 7001;


const startup = async () => {
  try {
    // 1. First connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB connected');

    // 2. Then connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // 3. Only then initialize counters
    await initCountryCounter();
    logger.info('✅ Country counter initialized');

    await initSchoolCounter();
    logger.info('✅ School counter initialized');

    // await getNextSchoolCounter('yourCountryRegistrationNumber');
    // logger.info('✅ School counter ready for use');

    await initStudentCounter();
    logger.info('✅ Student counter initialized');

    // 4. Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);

      console.log('Environment check:', {
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ? 'Present' : 'Missing',
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ? 'Present' : 'Missing',
      ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
      REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY
    });
    });

  // Add this to your main app file to verify env loading
  

  } catch (error) {
    logger.error('🔥 Startup failed:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the application
startup();
