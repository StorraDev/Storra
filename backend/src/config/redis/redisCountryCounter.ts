import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { Country } from "../../Country/countryModel";
import mongoose from "mongoose";

const REDIS_KEY = 'global:individualCounter';
const TTL = 86400; // 24 hours

const validateRedisValue = async (): Promise<number> => {
    try {
        const currentValue = await redis.get(REDIS_KEY);
        
        if (currentValue === null) {
            return -1; // Indicates key doesn't exist
        }
        
        const numValue = parseInt(currentValue, 10);
        
        // Check if the value is a valid integer
        if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
            logger.warn(`⚠️ Invalid Redis counter value detected: ${currentValue}. Resetting...`);
            await redis.del(REDIS_KEY); // Delete corrupted key
            return -1; // Treat as if key doesn't exist
        }
        
        return numValue;
    } catch (error) {
        logger.error('❌ Error validating Redis value', { error: (error as Error).message });
        return -1;
    }
};

const getLastRegistrationNumberFromDB = async (): Promise<number> => {
    try {
        // Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        if (!mongoose.connection.db) {
            throw new Error('MongoDB database connection not available');
        }
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const individualCollectionExists = collections.some(c => c.name === 'individuals');
        
        if (!individualCollectionExists) {
            logger.info('Individuals collection not found, starting from 0');
            return 0;
        }

        // Get the last registered individual
        const lastRegistered = await Country.findOne({})
            .sort({ createdAt: -1 })
            .limit(1)
            .maxTimeMS(5000);

        let lastNumber = 0;
        if (lastRegistered && lastRegistered.registrationNumber) {
            // Extract number from registration format like "NGA1/IND5"
            const match = lastRegistered.registrationNumber.match(/(\d+)$/);
            lastNumber = match ? parseInt(match[1], 10) : 0;
        }

        return lastNumber;
    } catch (error) {
        logger.error('❌ Error getting last registration number from DB', { 
            error: (error as Error).message 
        });
        return 0; // Safe fallback
    }
};


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
            logger.info(`Redis country counter already initialized at ${currentValue}`);
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