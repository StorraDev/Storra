import localCountries from './countryData.json';
import { Country } from './countryModel';
import { logger } from '../utils/logger';
import { initCountryCounter } from '../config/redis/redisCountryCounter';
import { client as redis } from '../config/redis/redis';
import { ICountryJson, ICountryRegistration } from '../types/countryTypes';

const registerCountryService = async (data: ICountryRegistration) => {
    const { name, email, password } = data;

    try {
        // 1. Find country in JSON data
        const countryData = (localCountries as ICountryJson[]).find(
            c => c.name.toLowerCase() === name.toLowerCase()
        );
        
        if (!countryData) {
            logger.error(`Country not found in data: ${name}`);
            throw new Error('Country not found in our database');
        }

        // 2. Check if country already exists by email or country code
        const existingCountry = await Country.findOne({
            $or: [
                { email: email.toLowerCase() },
                { countryCode: countryData.alpha3 }
            ]
        });

        if (existingCountry) {
            if (existingCountry.email === email.toLowerCase()) {
                logger.error(`Email already registered: ${email}`);
                throw new Error('Email already registered');
            } else {
                logger.error(`Country already registered: ${name} (${countryData.alpha3})`);
                throw new Error('Country already registered');
            }
        }

        // 3. Initialize Redis counter
        await initCountryCounter();

        // 4. Generate unique registration number
        let globalNumber = 0;
        let registrationNumber = '';
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Increment global counter
                globalNumber = await redis.incr('global:countryCounter');
                registrationNumber = `${countryData.alpha3}${globalNumber}`;

                // Check if this registration number already exists
                const existingRegNumber = await Country.findOne({ registrationNumber });
                
                if (!existingRegNumber) {
                    // Registration number is unique, break the loop
                    break;
                } else {
                    // Registration number exists, try again
                    logger.warn(`Registration number ${registrationNumber} already exists, trying again...`);
                    attempts++;
                }
            } catch (error) {
                logger.error('❌ Error generating registration number', { 
                    error: (error as Error).message,
                    attempt: attempts + 1 
                });
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('Failed to generate unique registration number');
                }
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique registration number after multiple attempts');
        }

        // 5. Create country document
        const newCountry = await Country.create({
            name: countryData.name,
            email: email.toLowerCase(),
            password, // Will be hashed by pre-save middleware
            countryCode: countryData.alpha3,
            registrationNumber,
            userType: 'country',
            isVerified: false
        });

        logger.info(`✅ Country registered successfully: ${newCountry.name} (${newCountry.countryCode}) - ${newCountry.registrationNumber}`);

        // 6. Return created country (password will be excluded by select in controller)
        return {
            country: newCountry,
            countryData: {
                name: countryData.name,
                officialName: countryData.officialName,
                alpha2: countryData.alpha2,
                alpha3: countryData.alpha3
            }
        };

    } catch (error) {
        logger.error('❌ Error in registerCountryService', { 
            error: (error as Error).message,
            countryName: name 
        });
        
        // Re-throw with more specific error messages
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error('Failed to register country');
        }
    }
};

// Additional service function to get country info without registration
const getCountryInfo = async (countryName: string) => {
    try {
        const countryData = (localCountries as ICountryJson[]).find(
            c => c.name.toLowerCase() === countryName.toLowerCase()
        );
        
        if (!countryData) {
            throw new Error('Country not found');
        }

        // Check if country is already registered
        const existingCountry = await Country.findOne({ 
            countryCode: countryData.alpha3 
        }).select('-password -refreshToken');

        return {
            countryData,
            isRegistered: !!existingCountry,
            registeredCountry: existingCountry
        };
    } catch (error) {
        logger.error('❌ Error in getCountryInfo', { 
            error: (error as Error).message,
            countryName 
        });
        throw error;
    }
};

// Service to get next available registration number for a country
const getNextRegistrationNumber = async (countryCode: string) => {
    try {
        // Find the highest registration number for this country code
        const lastCountry = await Country.findOne({
            registrationNumber: new RegExp(`^${countryCode}\\d+$`)
        }).sort({ registrationNumber: -1 });

        let nextNumber = 1;
        if (lastCountry) {
            const currentNumber = parseInt(lastCountry.registrationNumber.replace(countryCode, '')) || 0;
            nextNumber = currentNumber + 1;
        }

        return `${countryCode}${nextNumber}`;
    } catch (error) {
        logger.error('❌ Error getting next registration number', { 
            error: (error as Error).message,
            countryCode 
        });
        throw error;
    }
};

export { 
    registerCountryService, 
    getCountryInfo, 
    getNextRegistrationNumber 
};