import { client as redis } from "./redis";
import { logger } from "../../utils/logger"; //
import { Country } from "../../Country/countryModel"; // adjust the path as needed


const initCountryCounter = async () => {
    try {
         const redisKey = 'global:countryCounter';

        const currentValue = await redis.get(redisKey);
        if (currentValue !== null) {
            logger.info(`Redis counter already initialized at ${currentValue}`);
            return;
        }

        const lastRegistered = await Country.findOne({})
            .sort({ createdAt: -1 })
            .limit(1);

        const lastNumber = lastRegistered
            ? parseInt(lastRegistered.registrationNumber.replace(/^[A-Z]+/, '')) || 0
            : 0;

        await redis.set(redisKey, String(lastNumber));
        logger.info(`Redis counter initialized to ${lastNumber}`);

    } catch (error) {
        logger.error('❌ Error initializing country counter', { error: (error as Error).message });
        throw error;
    }
}

export { initCountryCounter}