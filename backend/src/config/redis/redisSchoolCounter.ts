// config/redis/redisSchoolCounter.ts
import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { School } from "../../School/schoolModel";
import mongoose from "mongoose";

const initSchoolCounter = async () => {
    try {
        const redisKey = 'global:schoolCounter';

        // 1. Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        // 2. Verify collection exists
        if (!mongoose.connection.db) {
            throw new Error('MongoDB database connection not available');
        }
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const schoolCollectionExists = collections.some(c => c.name === 'schools');
        
        if (!schoolCollectionExists) {
            logger.info('Schools collection not found, initializing counter to 0');
            await redis.set(redisKey, '0', {
                EX: 86400 // 24h TTL
            });
            logger.info('🎓 Redis school counter initialized to 0');
            return;
        }

        // 3. Get current Redis value
        const currentValue = await redis.get(redisKey);
        if (currentValue !== null) {
            logger.info(`🎓 Redis school counter already initialized at ${currentValue}`);
            return;
        }

        // 4. Safely query MongoDB to get the last registered school
        const lastRegistered = await School.findOne({})
            .sort({ createdAt: -1 })
            .limit(1)
            .maxTimeMS(5000); // Add query timeout

        let lastNumber = 0;
        if (lastRegistered && lastRegistered.registrationNumber) {
            // Extract number from registration format like "NGA1/SCH5"
            const match = lastRegistered.registrationNumber.match(/SCH(\d+)$/);
            lastNumber = match ? parseInt(match[1]) : 0;
        }

        // 5. Set Redis value
        await redis.set(redisKey, String(lastNumber), {
            EX: 86400 // 24h TTL
        });
        
        logger.info(`🎓 Redis school counter initialized to ${lastNumber}`);

    } catch (error) {
        logger.error('❌ Error initializing school counter', { 
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
        throw error;
    }
}

// Function to get next school counter for a specific country
const getNextSchoolCounter = async (countryRegistrationNumber: string): Promise<string> => {
    try {
        const redisKey = 'global:schoolCounter';
        
        // Initialize counter if not exists
        await initSchoolCounter();
        
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            try {
                // Increment global school counter
                const globalNumber = await redis.incr(redisKey);
                const registrationNumber = `${countryRegistrationNumber}/SCH${globalNumber}`;
                
                // Check if this registration number already exists
                const existingSchool = await School.findOne({ registrationNumber });
                
                if (!existingSchool) {
                    // Registration number is unique
                    return registrationNumber;
                } else {
                    // Registration number exists, try again
                    logger.warn(`School registration number ${registrationNumber} already exists, trying again...`);
                    attempts++;
                }
            } catch (error) {
                logger.error('❌ Error generating school registration number', { 
                    error: (error as Error).message,
                    attempt: attempts + 1 
                });
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Failed to generate unique school registration number');
                }
            }
        }
        
        throw new Error('Failed to generate unique school registration number after multiple attempts');
        
    } catch (error) {
        logger.error('❌ Error in getNextSchoolCounter', { 
            error: (error as Error).message,
            countryRegistrationNumber 
        });
        throw error;
    }
}

export { initSchoolCounter, getNextSchoolCounter };