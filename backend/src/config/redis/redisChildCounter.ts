// config/redis/redisChildCounter.ts
import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { Parent } from "../../Parent/parentModel";
import mongoose from "mongoose";

const REDIS_KEY = 'global:childCounter';
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
            logger.warn(`⚠️ Invalid Redis child counter value detected: ${currentValue}. Resetting...`);
            await redis.del(REDIS_KEY); // Delete corrupted key
            return -1; // Treat as if key doesn't exist
        }
        
        return numValue;
    } catch (error) {
        logger.error('❌ Error validating Redis child counter value', { error: (error as Error).message });
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
        const parentCollectionExists = collections.some(c => c.name === 'parents');
        
        if (!parentCollectionExists) {
            logger.info('Parents collection not found, starting child counter from 0');
            return 0;
        }

        // Get all parents and find the highest child registration number
        const parents = await Parent.find({}).select('children');
        
        let lastNumber = 0;
        
        for (const parent of parents) {
            if (parent.children && parent.children.length > 0) {
                for (const child of parent.children) {
                    if (child.registrationNumber) {
                        // Extract number from registration format like "NGA1/CHD123"
                        const match = child.registrationNumber.match(/CHD(\d+)$/);
                        if (match) {
                            const childNumber = parseInt(match[1], 10);
                            if (childNumber > lastNumber) {
                                lastNumber = childNumber;
                            }
                        }
                    }
                }
            }
        }

        return lastNumber;
    } catch (error) {
        logger.error('❌ Error getting last child registration number from DB', { 
            error: (error as Error).message 
        });
        return 0; // Safe fallback
    }
};

const initChildCounter = async (): Promise<void> => {
    try {
        // First validate existing Redis value
        const currentValue = await validateRedisValue();
        
        if (currentValue >= 0) {
            logger.info(`👶 Redis child counter already initialized at ${currentValue}`);
            return;
        }

        // Redis key doesn't exist or was corrupted, initialize from DB
        const lastNumber = await getLastRegistrationNumberFromDB();
        
        // Set Redis value with error handling
        await redis.set(REDIS_KEY, String(lastNumber), { EX: TTL });
        
        logger.info(`👶 Redis child counter initialized/recovered to ${lastNumber}`);
        
        // Verify the set operation worked
        const verifyValue = await redis.get(REDIS_KEY);
        if (verifyValue !== String(lastNumber)) {
            throw new Error(`Failed to set Redis child counter. Expected: ${lastNumber}, Got: ${verifyValue}`);
        }
        
    } catch (error) {
        logger.error('❌ Error initializing child counter', { 
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
        throw error;
    }
};

const getNextChildCounter = async (countryRegistrationNumber: string): Promise<string> => {
    try {
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            try {
                // Validate Redis counter before attempting increment
                const currentValue = await validateRedisValue();
                
                if (currentValue < 0) {
                    // Counter is invalid or doesn't exist, reinitialize
                    logger.info('🔄 Reinitializing child counter due to invalid state');
                    await initChildCounter();
                }
                
                // Attempt to increment
                const globalNumber = await redis.incr(REDIS_KEY);
                
                // Validate the incremented value
                if (isNaN(globalNumber) || !Number.isInteger(globalNumber) || globalNumber <= 0) {
                    throw new Error(`Invalid child counter value after increment: ${globalNumber}`);
                }
                
                const registrationNumber = `${countryRegistrationNumber}/CHD${globalNumber}`;
                
                // Check if this registration number already exists in any parent's children
                const existingChild = await Parent.findOne({ 
                    "children.registrationNumber": registrationNumber 
                });
                
                if (!existingChild) {
                    logger.info(`✅ Generated child registration number: ${registrationNumber}`);
                    return registrationNumber;
                } else {
                    // Registration number exists, try again
                    logger.warn(`Child registration number ${registrationNumber} already exists, trying again...`);
                    attempts++;
                }
                
            } catch (incrementError) {
                logger.error('❌ Error during child counter increment', { 
                    error: (incrementError as Error).message,
                    attempt: attempts + 1 
                });
                
                // If increment failed due to value error, try to recover
                if ((incrementError as Error).message.includes('not an integer')) {
                    logger.info('🔄 Attempting child counter recovery due to increment error');
                    await redis.del(REDIS_KEY);
                    await initChildCounter();
                }
                
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Failed to generate unique child registration number');
                }
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            }
        }
        
        throw new Error('Failed to generate unique child registration number after multiple attempts');
        
    } catch (error) {
        logger.error('❌ Error in getNextChildCounter', { 
            error: (error as Error).message,
            countryRegistrationNumber 
        });
        throw error;
    }
};

// Health check function to monitor counter state
const checkChildCounterHealth = async (): Promise<{ healthy: boolean; value: number | null; error?: string }> => {
    try {
        const value = await validateRedisValue();
        return {
            healthy: value >= 0,
            value: value >= 0 ? value : null,
            error: value < 0 ? 'Child counter is invalid or missing' : undefined
        };
    } catch (error) {
        return {
            healthy: false,
            value: null,
            error: (error as Error).message
        };
    }
};

export { initChildCounter, getNextChildCounter, checkChildCounterHealth };