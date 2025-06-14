// config/redis/redisstudentCounter.ts
import { client as redis } from "./redis";
import { logger } from "../../utils/logger";
import { Student } from "../../Student/studentModel";
import mongoose from "mongoose";

const initStudentCounter = async () => {
    try {
        const redisKey = 'global:studentCounter';

        // 1. Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        // 2. Verify collection exists
        if (!mongoose.connection.db) {
            throw new Error('MongoDB database connection not available');
        }
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const studentCollectionExists = collections.some(c => c.name === 'students');
        
        if (!studentCollectionExists) {
            logger.info('students collection not found, initializing counter to 0');
            await redis.set(redisKey, '0', {
                EX: 86400 // 24h TTL
            });
            logger.info('🎓 Redis student counter initialized to 0');
            return;
        }

        // 3. Get current Redis value
        const currentValue = await redis.get(redisKey);
        if (currentValue !== null) {
            logger.info(`🎓 Redis student counter already initialized at ${currentValue}`);
            return;
        }

        // 4. Safely query MongoDB to get the last registered student
        const lastRegistered = await Student.findOne({})
            .sort({ createdAt: -1 })
            .limit(1)
            .maxTimeMS(5000); // Add query timeout

        let lastNumber = 0;
        if (lastRegistered && lastRegistered.registrationNumber) {
            // Extract number from registration format like "NGA1/SCH5/STU123"
            const match = lastRegistered.registrationNumber.match(/STU(\d+)$/);
            lastNumber = match ? parseInt(match[1]) : 0;
        }

        // 5. Set Redis value
        await redis.set(redisKey, String(lastNumber), {
            EX: 86400 // 24h TTL
        });
        
        logger.info(`🎓 Redis student counter initialized to ${lastNumber}`);

    } catch (error) {
        logger.error('❌ Error initializing student counter', { 
            error: (error as Error).message,
            stack: (error as Error).stack 
        });
        throw error;
    }
}

// Function to get next student counter for a specific country
const getNextStudentCounter = async (schoolRegistrationNumber: string): Promise<string> => {
    try {
        const redisKey = 'global:studentCounter';
        
        // Initialize counter if not exists
        await initStudentCounter();
        
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            try {
                // Increment global student counter
                const globalNumber = await redis.incr(redisKey);
                const registrationNumber = `${schoolRegistrationNumber}/STU${globalNumber}`;
                
                // Check if this registration number already exists
                const existingStudent = await Student.findOne({ registrationNumber });
                
                if (!existingStudent) {
                    // Registration number is unique
                    return registrationNumber;
                } else {
                    // Registration number exists, try again
                    logger.warn(`Student registration number ${registrationNumber} already exists, trying again...`);
                    attempts++;
                }
            } catch (error) {
                logger.error('❌ Error generating student registration number', { 
                    error: (error as Error).message,
                    attempt: attempts + 1 
                });
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Failed to generate unique student registration number');
                }
            }
        }
        
        throw new Error('Failed to generate unique student registration number after multiple attempts');
        
    } catch (error) {
        logger.error('❌ Error in getNextStudentCounter', { 
            error: (error as Error).message,
            //countryRegistrationNumber,
            schoolRegistrationNumber
        });
        throw error;
    }
}

export { initStudentCounter, getNextStudentCounter };