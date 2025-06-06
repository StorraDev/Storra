import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./src/config/db/db.js";
import { connectRedis} from './src/config/redis/redis';
import { logger } from "./src/utils/logger.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({path: join(__dirname, ".env")});

const PORT = process.env.PORT || 7001;


connectDB()
connectRedis()
    .then((result) => {
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            
        })

        logger.info('✅ Redis ping successful:', { result });
    })
    .catch((error) => {
        logger.error('Error connecting to the database:', error);
        process.exit(1);
        
    })

