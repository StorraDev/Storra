import localCountries from './countryData.json';
import { Country} from  './countryModel';
import { logger } from '../utils/logger';
import { initCountryCounter } from '../config/redis/redisCountryCounter';
import { client as redis } from '../config/redis/redis';
import { ICountryJson, ICountryRegistration } from '../types/countryTypes';


const registerCountry = async (data: ICountryRegistration) => {
    const { name, email, password } = data;

    const country = ( localCountries as ICountryJson[]).find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!country) {
        logger.error(`Country not found: ${name}`);
        throw new Error('Country not found');
    }

    const existingCountry = await Country.findOne({ countryCode: country.alpha3})
    if (existingCountry) {
        logger.error(`Country already registered: ${name}`);
        throw new Error('Country already registered');
    }

    await initCountryCounter();

    let globalNumber = 0;

    try {
        globalNumber = await redis.incr('global:countryCounter');
        logger.info(`Global country counter incremented: ${globalNumber} for ${name} (${country.alpha3})`);
    } catch (error) {
        logger.error('❌ Error incrementing global country counter', { error: (error as Error).message });
        throw new Error('Failed to register country, please try again later');
    }
}


