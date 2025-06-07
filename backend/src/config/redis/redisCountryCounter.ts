import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { Country } from "../../Country/countryModel";
import mongoose from "mongoose";

const initCountryCounter = async () => {
    try {
        const redisKey = 'global:countryCounter';

        // 1. Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        // 2. Verify collection exists
        if (!mongoose.connection.db) {
            throw new Error('MongoDB database connection not available');
        }
        const collections = await mongoose.connection.db.listCollections().toArray();
        const countryCollectionExists = collections.some(c => c.name === 'countries');
        
        if (!countryCollectionExists) {
            throw new Error('Countries collection not found');
        }

        // 3. Get current Redis value
        const currentValue = await redis.get(redisKey);
        if (currentValue !== null) {
            logger.info(`Redis counter already initialized at ${currentValue}`);
            return;
        }

        // 4. Safely query MongoDB
        const lastRegistered = await Country.findOne({})
            .sort({ createdAt: -1 })
            .limit(1)
            .maxTimeMS(5000); // Add query timeout

        const lastNumber = lastRegistered
            ? parseInt(lastRegistered.registrationNumber.replace(/^[A-Z]+/, '')) || 0
            : 0;

        // 5. Set Redis value
        await redis.set(redisKey, String(lastNumber), {
            EX: 86400 // 24h TTL
        });
        
        logger.info(`Redis counter initialized to ${lastNumber}`);

    } catch (error) {
        logger.error('❌ Error initializing country counter', { 
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
        throw error;
    }
}

export { initCountryCounter };