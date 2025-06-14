// config/redis/redisSchoolCounter.ts
import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { Individual } from "../../Individual/indvidualModel";
import mongoose from "mongoose";

const initIndividualCounter = async () => {
    try {
        const redisKey = 'global:individualCounter';

        // 1. Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        // 2. Verify collection exists
        if (!mongoose.connection.db) {
            throw new Error('MongoDB database connection not available');
        }
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const individualCollectionExists = collections.some(c => c.name === 'individuals');
        
        if (!individualCollectionExists) {
            logger.info('Individuals collection not found, initializing counter to 0');
            await redis.set(redisKey, '0', {
                EX: 86400 // 24h TTL
            });
            logger.info('🎓 Redis individual counter initialized to 0');
            return;
        }

        // 3. Get current Redis value
        const currentValue = await redis.get(redisKey);
        if (currentValue !== null) {
            logger.info(`🎓 Redis individual counter already initialized at ${currentValue}`);
            return;
        }

        // 4. Safely query MongoDB to get the last registered individual
        const lastRegistered = await Individual.findOne({})
            .sort({ createdAt: -1 })
            .limit(1)
            .maxTimeMS(5000); // Add query timeout

        let lastNumber = 0;
        if (lastRegistered && lastRegistered.registrationNumber) {
            // Extract number from registration format like "NGA1/IND5"
            const match = lastRegistered.registrationNumber.match(/IND(\d+)$/);
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
const getNextIndividualCounter = async (countryRegistrationNumber: string): Promise<string> => {
    try {
        const redisKey = 'global:individualCounter';
        
        // Initialize counter if not exists
        await initIndividualCounter();
        
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            try {
                // Increment global school counter
                const globalNumber = await redis.incr(redisKey);
                const registrationNumber = `${countryRegistrationNumber}/SCH${globalNumber}`;
                
                // Check if this registration number already exists
                const existingSchool = await Individual.findOne({ registrationNumber });
                
                if (!existingSchool) {
                    // Registration number is unique
                    return registrationNumber;
                } else {
                    // Registration number exists, try again
                    logger.warn(`Individual registration number ${registrationNumber} already exists, trying again...`);
                    attempts++;
                }
            } catch (error) {
                logger.error('❌ Error generating individual registration number', { 
                    error: (error as Error).message,
                    attempt: attempts + 1 
                });
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Failed to generate unique individual registration number');
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

export { initIndividualCounter, getNextIndividualCounter };